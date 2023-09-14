import moment from "moment";
import { CommentRepo } from "../comment/repository/CommentRepo";
import { SteamApi } from "../external-api/SteamApi";
import { NadeRepo } from "../nade/repository/NadeRepo";
import { StatsRepo } from "../stats/repository/StatsRepo";
import { AppContext } from "../utils/AppContext";
import { UserCreateDto, UserUpdateDto } from "./UserDTOs";
import { UserModel, UserModelAnon } from "./UserModel";
import { UserFilter } from "./repository/UserFireRepo";
import { UserRepo } from "./repository/UserRepo";

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
    steamId: string,
    skipCache = false
  ): Promise<UserModel | UserModelAnon | null> => {
    const { authUser } = context;
    const user = await this.userRepo.byId(steamId, { skipCache });

    if (!user) {
      return null;
    }

    const isUser = authUser?.role === "user";
    const requestingSelf = authUser?.steamId === steamId;
    const shouldAnonomize = !requestingSelf && isUser;

    if (shouldAnonomize) {
      delete user["email"];
    }

    return user;
  };

  getOrCreate = async (steamId: string): Promise<UserModel | null> => {
    const user = await this.userRepo.byId(steamId, { skipCache: true });

    if (user) {
      return user;
    }

    const createdUser = await this.createUser(steamId);

    return createdUser;
  };

  private createUser = async (steamId: string): Promise<UserModel> => {
    const player = await this.steamApi.getPlayerBySteamID(steamId);

    const createUserDto: UserCreateDto = {
      steamId: player.steamID,
      nickname: player.nickname,
      avatar: player.avatar.medium,
    };

    const newUser = await this.userRepo.create(createUserDto);
    await this.statsRepo.incrementUserCounter();

    return newUser;
  };

  update = async (
    steamId: string,
    userUpdateDto: UserUpdateDto
  ): Promise<UserModel> => {
    const updatedUser = await this.userRepo.update(steamId, userUpdateDto);

    await this.nadeRepo.updateUserOnNades(steamId, {
      nickname: updatedUser.nickname,
      avatar: updatedUser.avatar,
      steamId: steamId,
    });

    await this.commentRepo.updateUserDetailsForComments(updatedUser);

    return updatedUser;
  };

  updateActivity = (steamId: string) => {
    return this.userRepo.updateActivity(steamId);
  };

  async attemptAvatarRefresh(steamId: string) {
    const user = await this.userRepo.byId(steamId, { skipCache: true });

    if (!user) {
      return;
    }

    const player = await this.steamApi.getPlayerBySteamID(user.steamId);

    const hasNewAvatar = player.avatar.medium !== user.avatar;

    if (!hasNewAvatar) {
      return;
    }

    const updatedUser = await this.userRepo.update(steamId, {
      avatar: player.avatar.medium,
    });

    await this.nadeRepo.updateUserOnNades(steamId, updatedUser);
    await this.commentRepo.updateUserDetailsForComments(updatedUser);
  }

  async attemptToUpdateUserNadeCount(steamId: string) {
    const user = await this.userRepo.byId(steamId, { skipCache: true });

    if (!user) {
      return;
    }

    if (typeof user.numNades === "undefined" || user.numNades < 0) {
      const nades = await this.nadeRepo.getByUser(user.steamId);
      this.userRepo.update(user.steamId, { numNades: nades.length });
    } else {
      const daysSinceLastUpdate = moment().diff(
        moment(user.updatedAt),
        "days",
        false
      );

      if (daysSinceLastUpdate > 7) {
        const nades = await this.nadeRepo.getByUser(user.steamId);

        this.userRepo.update(user.steamId, { numNades: nades.length });
      }
    }
  }

  public recountUserNades = async (steamId: string) => {
    const user = await this.userRepo.byId(steamId, { skipCache: true });

    if (!user) {
      return;
    }

    const nades = await this.nadeRepo.getByUser(user.steamId);

    this.userRepo.update(user.steamId, { numNades: nades.length });
  };
}
