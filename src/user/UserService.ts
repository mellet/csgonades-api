import { CSGNUser, makeUser } from "./User";
import { UserRepo } from "./UserRepo";
import { SteamService } from "../steam/SteamService";

export interface UserService {
  bySteamID(steamId: string): Promise<CSGNUser>;

  getOrCreateUser(steamId: string): Promise<CSGNUser>;
}

export const makeUserService = (
  userRepo: UserRepo,
  steamService: SteamService
): UserService => {
  const bySteamID = async (steamId: string): Promise<CSGNUser> => {
    const user = await userRepo.bySteamID(steamId);

    return user;
  };

  const getOrCreateUser = async (steamId: string) => {
    let user = await userRepo.bySteamID(steamId);

    if (!user) {
      const player = await steamService.getPlayerBySteamID(steamId);
      const dateNow = new Date();
      const newUser = makeUser({
        steamID: player.steamID,
        nickname: player.nickname,
        avatar: player.avatar.medium,
        bio: null,
        email: null,
        role: "user",
        createdAt: dateNow,
        lastActive: dateNow,
        updatedAt: dateNow
      });
      user = await userRepo.createUser(newUser);
    }

    return user;
  };

  return {
    bySteamID,
    getOrCreateUser
  };
};
