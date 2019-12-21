import { Result } from "neverthrow";
import { UserModel, UserCreateModel } from "./UserModel";
import { AppResult } from "../utils/Common";

export interface IUserRepo {
  all(limit?: number): AppResult<UserModel[]>;
  bySteamID(steamID: string): AppResult<UserModel>;
  createUser(user: UserCreateModel): AppResult<UserModel>;
  updateActivity(user: UserModel): AppResult<boolean>;
}
