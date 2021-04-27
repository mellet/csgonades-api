import { Role } from "./UserModel";

export type UserDto = {
  nickname: string;
  steamId: string;
  role: Role;
  avatar: string;
  bio?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
};

export type UserLightDTO = {
  nickname: string;
  steamId: string;
  avatar: string;
  createdAt: Date;
};

export type UserMiniDto = {
  nickname: string;
  steamId: string;
  avatar?: string;
  role?: Role;
};

export type UserCreateDto = {
  nickname: string;
  steamId: string;
  role: Role;
  avatar: string;
};

export type UserUpdateDto = {
  nickname?: string;
  bio?: string;
  email?: string;
  createdAt?: string;
  avatar?: string;
};
