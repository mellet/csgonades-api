import { Role } from "./UserModel";

export type UserDTO = {
  nickname: string;
  steamID: string;
  role: Role;
  avatar: string;
  bio?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
};
