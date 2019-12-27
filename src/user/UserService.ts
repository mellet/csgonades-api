import { IUserRepo } from "./UserRepo";
import { ISteamService } from "../steam/SteamService";
import { UserModel, UserCreateModel } from "./UserModel";
import { AppResult } from "../utils/Common";
import { StatsService } from "../stats/StatsService";

export interface IUserService {
  bySteamID(steamId: string): AppResult<UserModel>;

  getOrCreateUser(steamId: string): AppResult<UserModel>;
}

export class UserService implements IUserService {
  private userRepo: IUserRepo;
  private steamService: ISteamService;
  private statsService: StatsService;

  constructor(
    userRepo: IUserRepo,
    steamService: ISteamService,
    statsService: StatsService
  ) {
    this.userRepo = userRepo;
    this.steamService = steamService;
    this.statsService = statsService;
  }

  async bySteamID(steamId: string): AppResult<UserModel> {
    const user = await this.userRepo.bySteamID(steamId);

    return user;
  }

  async getOrCreateUser(steamId: string): AppResult<UserModel> {
    let user = await this.userRepo.bySteamID(steamId);

    if (user.isErr()) {
      const playerResult = await this.steamService.getPlayerBySteamID(steamId);

      if (playerResult.isOk()) {
        const player = playerResult.value;

        const newUser: UserCreateModel = {
          steamId: player.steamID,
          nickname: player.nickname,
          avatar: player.avatar.medium,
          role: "user"
        };

        user = await this.userRepo.createUser(newUser);
        this.statsService.incrementUserCounter();
      }
    }

    return user;
  }
}
