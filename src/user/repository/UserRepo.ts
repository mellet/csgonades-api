import { UserCreateDto, UserDto, UserUpdateDto } from "../UserDTOs";
import { UserModel } from "../UserModel";
import { UserFilter } from "./UserFireRepo";

export type UserByIdConfig = {
  skipCache: boolean;
};

export interface UserRepo {
  all: (filter: UserFilter) => Promise<UserDto[]>;
  byId: (steamId: string, config?: UserByIdConfig) => Promise<UserModel | null>;
  create: (userCreate: UserCreateDto) => Promise<UserModel>;
  update: (steamId: string, updateFields: UserUpdateDto) => Promise<UserModel>;
  updateActivity: (steamId: string) => Promise<void>;
}
