import { firestore } from "firebase-admin";

export type Role = "admin" | "moderator" | "user";

export type CSGNUser = {
  nickname: string;
  steamID: string;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
};

export type CSGNUserDoc = {
  nickname: string;
  steamID: string;
  email: string;
  avatar: string;
  bio: string;
  role: Role;
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
  lastActive: firestore.Timestamp;
};

export const makeUser = (user: CSGNUser): CSGNUser => {
  return user;
};

export const convertUserToFirebase = (user: CSGNUser): CSGNUserDoc => {
  const userDoc: CSGNUserDoc = {
    steamID: user.steamID,
    nickname: user.nickname,
    role: user.role,
    createdAt: firestore.Timestamp.fromDate(user.createdAt),
    updatedAt: firestore.Timestamp.fromDate(user.updatedAt),
    lastActive: firestore.Timestamp.fromDate(user.lastActive),
    avatar: user.avatar || "",
    bio: user.bio || "",
    email: user.email || ""
  };
  return userDoc;
};

export const convertUserFromFirebase = (userDoc: CSGNUserDoc): CSGNUser => {
  const user: CSGNUser = {
    ...userDoc,
    createdAt: userDoc.createdAt.toDate(),
    updatedAt: userDoc.updatedAt.toDate(),
    lastActive: userDoc.lastActive.toDate()
  };
  return user;
};
