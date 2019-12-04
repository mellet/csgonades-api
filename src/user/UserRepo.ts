import { CSGNUser } from "./User";

export interface UserRepo {
  bySteamID(steamID: string): Promise<CSGNUser | null>;
  createUser(user: CSGNUser): Promise<CSGNUser>;
  updateActivity(user: CSGNUser): Promise<void>;
}
