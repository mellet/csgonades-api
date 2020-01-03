import { ISteamService } from "../steam/SteamService";
import { UserModel, UserModelAnon } from "./UserModel";
import { StatsService } from "../stats/StatsService";
import { UserUpdateDTO, UserCreateDTO } from "./UserDTOs";
import { UserRepo } from "./UserRepo";

export class UserService {
  private userRepo: UserRepo;
  private steamService: ISteamService;
  private statsService: StatsService;

  constructor(
    userRepo: UserRepo,
    steamService: ISteamService,
    statsService: StatsService
  ) {
    this.userRepo = userRepo;
    this.steamService = steamService;
    this.statsService = statsService;
  }

  all = (limit?: number) => this.userRepo.all(limit);

  byId = (steamId: string) => this.userRepo.byId(steamId);

  byIdAnon = async (steamId: string): Promise<UserModelAnon> => {
    const user = await this.userRepo.byId(steamId);
    delete user["email"];
    return user;
  };

  getOrCreate = async (steamId: string): Promise<UserModel> => {
    const user = await this.userRepo.byId(steamId);

    if (!user) {
      const player = await this.steamService.getPlayerBySteamID(steamId);

      const newUser: UserCreateDTO = {
        steamId: player.steamID,
        nickname: player.nickname,
        avatar: player.avatar.medium,
        role: "user"
      };

      const user = await this.userRepo.create(newUser);

      await this.statsService.incrementUserCounter();

      return user;
    }

    return user;
  };

  update = (steamId: string, update: UserUpdateDTO) => {
    return this.userRepo.update(steamId, update);
  };
}
