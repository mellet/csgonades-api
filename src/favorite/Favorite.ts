export type FavoriteModel = {
  nadeId: string;
  userId: string;
  createdAt: Date;
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
