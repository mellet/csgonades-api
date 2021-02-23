import { CommentRepo } from "../comment/repository/CommentRepo";
import { SteamApi } from "../external-api/SteamApi";
import { NadeRepo } from "../nade/repository/NadeRepo";
import { StatsRepo } from "../stats/repository/StatsRepo";
import { AppContext } from "../utils/AppContext";
import { ErrorFactory } from "../utils/ErrorUtil";
import { UserFilter } from "./repository/UserFireRepo";
import { UserRepo } from "./repository/UserRepo";
import { UserCreateDto, UserUpdateDto } from "./UserDTOs";
import { UserModel, UserModelAnon } from "./UserModel";

type UserServiceDeps = {
  nadeRepo: NadeRepo;
  userRepo: UserRepo;
  statsRepo: StatsRepo;
  commentRepo: CommentRepo;
  steamApi: SteamApi;
};

export class UserService {
  private userRepo: UserRepo;
  private steamApi: SteamApi;
  private statsRepo: StatsRepo;
  private nadeRepo: NadeRepo;
  private commentRepo: CommentRepo;

  constructor(deps: UserServiceDeps) {
    this.userRepo = deps.userRepo;
    this.steamApi = deps.steamApi;
    this.statsRepo = deps.statsRepo;
    this.nadeRepo = deps.nadeRepo;
    this.commentRepo = deps.commentRepo;
  }

  all = (filter: UserFilter) => {
    return this.userRepo.all(filter);
  };

  byId = async (
    context: AppContext,
    steamId: string
  ): Promise<UserModel | UserModelAnon> => {
    const { authUser } = context;
    const user = await this.userRepo.byId(steamId);

    if (!user) {
      throw ErrorFactory.NotFound("User not found");
    }

    const isUser = authUser?.role === "user";
    const requestingSelf = authUser?.steamId === steamId;
    const shouldAnonomize = !requestingSelf && isUser;

    if (shouldAnonomize) {
      delete user["email"];
    }

    this.tryAvatarRefresh(user);

    return user;
  };

  getOrCreate = async (steamId: string): Promise<UserModel> => {
    const user = await this.userRepo.byId(steamId);

    if (user) {
      this.tryAvatarRefresh(user);
      return user;
    }

    const player = await this.steamApi.getPlayerBySteamID(steamId);

    const createUserDto: UserCreateDto = {
      steamId: player.steamID,
      nickname: player.nickname,
      avatar: player.avatar.medium,
      role: "user",
    };

    const newUser = await this.userRepo.create(createUserDto);
    await this.statsRepo.incrementUserCounter();

    return newUser;
  };

  update = async (
    context: AppContext,
    steamId: string,
    userUpdateDto: UserUpdateDto
  ) => {
    const { authUser } = context;

    const isUpdatingSelf = authUser?.steamId === steamId;
    const isPrivilegedUser = authUser?.role === "administrator";

    if (!isUpdatingSelf && !isPrivilegedUser) {
      throw ErrorFactory.Forbidden("You are not allowed to edit this user");
    }

    const updatedUser = await this.userRepo.update(steamId, userUpdateDto);

    if (!updatedUser) {
      throw ErrorFactory.InternalServerError("Failed to update user");
    }

    await this.nadeRepo.updateUserOnNades(steamId, {
      nickname: updatedUser.nickname,
      avatar: updatedUser.avatar,
      steamId: steamId,
    });

    return updatedUser;
  };

  updateActivity = (steamId: string) => {
    return this.userRepo.updateActivity(steamId);
  };

  private async tryAvatarRefresh(user: UserModel) {
    const { steamId } = user;
    const player = await this.steamApi.getPlayerBySteamID(user.steamId);

    const hasNewAvatar = player.avatar.medium !== user.avatar;

    if (!hasNewAvatar) {
      return;
    }

    const updatedUser = await this.userRepo.update(steamId, {
      avatar: player.avatar.medium,
    });

    if (!updatedUser) {
      return;
    }

    await this.nadeRepo.updateUserOnNades(steamId, updatedUser);
    await this.commentRepo.updateUserDetailsForComments(updatedUser);
  }
}
