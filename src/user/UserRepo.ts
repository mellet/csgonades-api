import { User } from "./User";

export interface UserRepo {
  bySteamID(steamID: string): Promise<User>;
  createUser(user: User): Promise<User>;
}
