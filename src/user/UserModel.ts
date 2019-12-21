import { firestore } from "firebase-admin";

export type Role = "administrator" | "moderator" | "user";

export type UserModel = {
  nickname: string;
  steamId: string;
  avatar: string;
  role: Role;
  email?: string;
  bio?: string;
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
  lastActive: firestore.Timestamp;
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
