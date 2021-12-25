import { Tickrate } from "../nade/nadeSubTypes/Tickrate";

export type Role = "administrator" | "moderator" | "user";

export type UserModel = {
  nickname: string;
  steamId: string;
  avatar: string;
  role: Role;
  email?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
  defaultTick?: Tickrate;
};

export type UserModelAnon = {
  nickname: string;
  steamId: string;
  avatar: string;
  role: Role;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
};

export type UserLightModel = {
  nickname: string;
  steamId: string;
  avatar: string;
};

export type UserCreateModel = Omit<
  UserModel,
  "createdAt" | "updatedAt" | "lastActive"
>;
