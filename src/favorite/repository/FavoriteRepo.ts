import { FavoriteCreateModel } from "../dto/FavoriteCreateModel";
import { FavoriteDto } from "../dto/FavoriteDto";

export interface FavoriteRepo {
  addFavorite: (favorite: FavoriteCreateModel) => Promise<FavoriteDto>;
  removeFavorite: (favoriteId: string) => Promise<FavoriteDto | null>;
  reomveFavoriteForNade: (nadeId: string, steamId: string) => Promise<void>;
  deleteWhereNadeId: (nadeId: string) => Promise<void>;
  byId: (favoriteId: string) => Promise<FavoriteDto | null>;
  byUser: (steamId: string) => Promise<FavoriteDto[]>;
}
