import { NadeDTO } from "../nade/Nade";
import { EventBus } from "../services/EventHandler";
import { ErrorFactory } from "../utils/ErrorUtil";
import { makeFavorite } from "./Favorite";
import { FavoriteRepo } from "./FavoriteRepo";

type FavoriteDeps = {
  favoriteRepo: FavoriteRepo;
  eventBus: EventBus;
};

export class FavoriteService {
  private favoriteRepo: FavoriteRepo;
  private eventBus: EventBus;

  constructor(deps: FavoriteDeps) {
    const { eventBus } = deps;
    this.favoriteRepo = deps.favoriteRepo;
    this.eventBus = eventBus;
    eventBus.subNadeDelete(this.deleteFavoritesForNade);
  }

  getTodaysFavorites = () => {
    return this.favoriteRepo.newToday();
  };

  getFavoritesForUser = async (steamId: string) => {
    const favorites = await this.favoriteRepo.byUser(steamId);
    return favorites;
  };

  createFavoriteForUser = async (steamId: string, nadeId: string) => {
    const newFavorite = makeFavorite(nadeId, steamId);
    const favorite = await this.favoriteRepo.set(newFavorite);

    this.eventBus.emitNewFavorite(favorite);
    return favorite;
  };

  unFavorite = async (steamId: string, favoriteId: string): Promise<void> => {
    const allowUnfavorite = await this.isOwnerOfFavorite(steamId, favoriteId);

    if (!allowUnfavorite) {
      throw ErrorFactory.Forbidden("You can't unfavorite this item.");
    }

    const favorite = await this.favoriteRepo.unSet(favoriteId);

    if (!favorite) {
      throw ErrorFactory.NotFound("Favorite not found.");
    }

    this.eventBus.emitUnFavorite(favorite);
    return;
  };

  private deleteFavoritesForNade = (nade: NadeDTO) => {
    return this.favoriteRepo.deleteByNadeId(nade.id);
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
