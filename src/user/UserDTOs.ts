import { Tickrate } from "../nade/nadeSubTypes/Tickrate";
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
  defaultTick?: Tickrate;
  numNades?: number;
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
  numNades: number;
};

export type UserUpdateDto = {
  nickname?: string;
  bio?: string;
  email?: string;
  createdAt?: string;
  avatar?: string;
  defaultTick?: Tickrate;
  numNades?: number;
};
