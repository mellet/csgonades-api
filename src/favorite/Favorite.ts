import { firestore } from "firebase-admin";

export type FavoriteModel = {
  id: string;
  nadeId: string;
  userId: string;
  createdAt: firestore.Timestamp;
};

export type FavoriteCreateModel = Omit<FavoriteModel, "createdAt" | "id">;

export type FavoriteDTO = {
  id: string;
  nadeId: string;
  userId: string;
  createdAt: Date;
};

export const makeFavorite = (
  forNadeId: string,
  byUserId: string
): FavoriteCreateModel => {
  return {
    nadeId: forNadeId,
    userId: byUserId
  };
};

export const toFavoriteDTO = (model: FavoriteModel): FavoriteDTO => {
  return {
    id: model.id,
    nadeId: model.nadeId,
    userId: model.userId,
    createdAt: model.createdAt.toDate()
  };
};
