import { FavoriteCreateModel } from "./FavoriteCreateModel";

export type FavoriteFireModel = {
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
    userId: byUserId,
  };
};
