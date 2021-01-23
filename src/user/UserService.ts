import { SteamApi } from "../external-api/SteamApi";
import { NadeRepo } from "../nade/NadeRepo";
import { StatsRepo } from "../stats/StatsRepo";
import { UserCreateDTO, UserUpdateDTO } from "./UserDTOs";
import { UserModel, UserModelAnon } from "./UserModel";
import { UserFilter, UserRepo } from "./UserRepo";

type UserServiceDeps = {
  nadeRepo: NadeRepo;
  userRepo: UserRepo;
  statsRepo: StatsRepo;
  steamApi: SteamApi;
};

export class UserService {
  private userRepo: UserRepo;
  private steamApi: SteamApi;
  private statsRepo: StatsRepo;
  private nadeRepo: NadeRepo;

  constructor(deps: UserServiceDeps) {
    this.userRepo = deps.userRepo;
    this.steamApi = deps.steamApi;
    this.statsRepo = deps.statsRepo;
    this.nadeRepo = deps.nadeRepo;
  }

  all = (filter: UserFilter) => {
    return this.userRepo.all(filter);
  };

  byId = (steamId: string) => {
    return this.userRepo.byId(steamId);
  };

  byIdAnon = async (steamId: string): Promise<UserModelAnon> => {
    const user = await this.userRepo.byId(steamId);
    delete user["email"];

    return user;
  };

  getOrCreate = async (steamId: string): Promise<UserModel> => {
    try {
      const user = await this.userRepo.byId(steamId);
      return user;
    } catch (error) {
      const player = await this.steamApi.getPlayerBySteamID(steamId);

      const newUser: UserCreateDTO = {
        steamId: player.steamID,
        nickname: player.nickname,
        avatar: player.avatar.medium,
        role: "user",
      };
      const user = await this.userRepo.create(newUser);
      await this.statsRepo.incrementUserCounter();

      return user;
    }
  };

  update = async (steamId: string, update: UserUpdateDTO) => {
    const res = await this.userRepo.update(steamId, update);

    if (res) {
      this.nadeRepo.updateUserOnNades(steamId, {
        nickname: res.nickname,
        avatar: res.avatar,
        steamId: steamId,
      });
    }

    return res;
  };

  updateActivity = (steamId: string) => {
    return this.userRepo.updateActivity(steamId);
  };
}
