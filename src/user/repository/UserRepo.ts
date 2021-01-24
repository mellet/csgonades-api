import { UserCreateDto, UserDto, UserUpdateDto } from "../UserDTOs";
import { UserModel } from "../UserModel";
import { UserFilter } from "./UserFireRepo";

export interface UserRepo {
  all: (filter: UserFilter) => Promise<UserDto[]>;
  byId: (steamId: string) => Promise<UserModel | null>;
  create: (userCreate: UserCreateDto) => Promise<UserModel>;
  update: (
    steamId: string,
    updateFields: UserUpdateDto
  ) => Promise<UserModel | null>;
  updateActivity: (steamId: string) => Promise<void>;
}
