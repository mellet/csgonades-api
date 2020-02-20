import { EventBus } from "../services/EventHandler";
import { ISteamService } from "../steam/SteamService";
import { nicknameCleaner } from "../utils/Common";
import { UserCreateDTO, UserUpdateDTO } from "./UserDTOs";
import { UserModel, UserModelAnon } from "./UserModel";
import { UserFilter, UserRepo } from "./UserRepo";

type UserServiceDeps = {
  userRepo: UserRepo;
  steamService: ISteamService;
  eventBus: EventBus;
};

export class UserService {
  private userRepo: UserRepo;
  private steamService: ISteamService;
  private eventBus: EventBus;

  constructor(deps: UserServiceDeps) {
    this.userRepo = deps.userRepo;
    this.steamService = deps.steamService;
    this.eventBus = deps.eventBus;
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
      const player = await this.steamService.getPlayerBySteamID(steamId);

      const newUser: UserCreateDTO = {
        steamId: player.steamID,
        nickname: nicknameCleaner(player.nickname, player.realName),
        avatar: player.avatar.medium,
        role: "user"
      };
      const user = await this.userRepo.create(newUser);

      this.eventBus.emitNewUser(user);

      return user;
    }
  };

  update = (steamId: string, update: UserUpdateDTO) => {
    return this.userRepo.update(steamId, update);
  };

  updateActivity = (steamId: string) => {
    return this.userRepo.updateActivity(steamId);
  };
}
