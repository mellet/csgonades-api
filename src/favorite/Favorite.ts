import { firestore } from "firebase-admin";

export type FavoriteModel = {
  id: string;
  nadeID: string;
  userID: string;
  createdAt: firestore.Timestamp;
};

export type FavoriteCreateModel = Omit<FavoriteModel, "createdAt" | "id">;

export type FavoriteDTO = {
  id: string;
  nadeID: string;
  userID: string;
  createdAt: Date;
};

export const makeFavorite = (
  forNadeId: string,
  byUserId: string
): FavoriteCreateModel => {
  return {
    nadeID: forNadeId,
    userID: byUserId
  };
};
