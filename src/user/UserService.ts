import { IUserRepo } from "./UserRepo";
import { ISteamService } from "../steam/SteamService";
import { UserModel, UserCreateModel } from "./UserModel";
import { AppResult } from "../utils/Common";
import { StatsService } from "../stats/StatsService";
import { UserUpdateDTO } from "./UserDTOs";

export interface IUserService {
  all(): AppResult<UserModel[]>;

  bySteamID(steamId: string): AppResult<UserModel>;

  getOrCreateUser(steamId: string): AppResult<UserModel>;

  updateUser(
    steamId: string,
    updateFields: UserUpdateDTO
  ): AppResult<UserModel>;
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

  all(): AppResult<UserModel[]> {
    return this.userRepo.all();
  }

  bySteamID(steamId: string): AppResult<UserModel> {
    return this.userRepo.bySteamID(steamId);
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

  updateUser(
    steamId: string,
    updateFields: UserUpdateDTO
  ): AppResult<UserModel> {
    return this.userRepo.updateUser(steamId, updateFields);
    // Update all nades of user
  }
}
