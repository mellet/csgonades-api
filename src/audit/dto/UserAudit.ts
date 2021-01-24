import { Role } from "../../user/UserModel";

export type UserAudit = {
  nickname: string;
  steamId: string;
  avatar: string;
  role: Role;
};
