import { UserModel, UserCreateModel } from "./UserModel";
import { AppResult } from "../utils/Common";
import { UserUpdateDTO } from "./UserDTOs";

export interface IUserRepo {
  all(limit?: number): AppResult<UserModel[]>;

  bySteamID(steamID: string): AppResult<UserModel>;

  createUser(user: UserCreateModel): AppResult<UserModel>;

  updateActivity(user: UserModel): AppResult<boolean>;

  updateUser(
    steamId: string,
    updateFields: UserUpdateDTO
  ): AppResult<UserModel>;
}
