import { Role } from "../../user/UserModel";

export type CommentModel = {
  nadeId: string;
  steamId: string;
  nickname: string;
  avatar?: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
  role?: Role;
};
