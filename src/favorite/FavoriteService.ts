import { NadeService } from "../nade/NadeService";
import { CachingService } from "../services/CachingService";
import { ErrorFactory } from "../utils/ErrorUtil";
import { makeFavorite } from "./Favorite";
import { FavoriteRepo } from "./FavoriteRepo";

type FavoriteDeps = {
  favoriteRepo: FavoriteRepo;
  nadeService: NadeService;
  cache: CachingService;
};

export class FavoriteService {
  private favoriteRepo: FavoriteRepo;
  private nadeService: NadeService;
  private cache: CachingService;

  constructor(deps: FavoriteDeps) {
    this.favoriteRepo = deps.favoriteRepo;
    this.nadeService = deps.nadeService;
    this.cache = deps.cache;
  }

  getFavoritesForUser = async (steamId: string) => {
    const favorites = await this.favoriteRepo.byUser(steamId);
    return favorites;
  };

  createFavoriteForUser = async (steamId: string, nadeId: string) => {
    const newFavorite = makeFavorite(nadeId, steamId);
    const favorite = await this.favoriteRepo.set(newFavorite);

    await this.nadeService.incrementFavoriteCount(nadeId);
    this.cache.invalidateNade(nadeId);

    return favorite;
  };

  unFavorite = async (steamId: string, favoriteId: string): Promise<void> => {
    const allowUnfavorite = await this.isOwnerOfFavorite(steamId, favoriteId);

    if (!allowUnfavorite) {
      throw ErrorFactory.Forbidden("You can't unfavorite this item.");
    }

    const favorite = await this.favoriteRepo.unSet(favoriteId);

    if (!favorite) {
      // TODO: Throw sensible error
      return;
    }

    await this.nadeService.decrementFavoriteCount(favorite.nadeId);
    this.cache.invalidateNade(favorite.nadeId);

    return;
  };

  private isOwnerOfFavorite = async (
    steamId: string,
    favoriteId: string
  ): Promise<boolean> => {
    const favorite = await this.favoriteRepo.byId(favoriteId);

    if (!favorite) {
      // TODO: Throw sensible error
      return false;
    }

    if (favorite.userId === steamId) {
      return true;
    }

    return false;
  };
}
