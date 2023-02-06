import { Tickrate } from "../nade/nadeSubTypes/Tickrate";

const Roles = {
  administrator: "administrator",
  moderator: "moderator",
  user: "user",
};

export type Role = keyof typeof Roles;

export function validUserRoles() {
  const roles: string[] = [];
  for (const key in Roles) {
    roles.push(key);
  }
  return roles;
}

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
  numNades?: number;
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
  numNades?: number;
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
