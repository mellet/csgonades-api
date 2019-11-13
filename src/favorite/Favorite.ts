export type Favorite = {
  id: string;
  nadeID: string;
  userID: string;
};

export const makeFavorite = (forNadeId: string, byUserId: string): Favorite => {
  return {
    id: "",
    nadeID: forNadeId,
    userID: byUserId
  };
};
