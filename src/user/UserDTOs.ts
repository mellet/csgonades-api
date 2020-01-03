import { Role } from "./UserModel";

export type UserDTO = {
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

export type UserCreateDTO = {
  nickname: string;
  steamId: string;
  role: Role;
  avatar: string;
};

export type UserUpdateDTO = {
  nickname?: string;
  bio?: string;
  email?: string;
  createdAt?: string;
};
