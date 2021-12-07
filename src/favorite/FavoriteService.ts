import { Logger } from "../logger/Logger";
import { NadeRepo } from "../nade/repository/NadeRepo";
import { NotificationRepo } from "../notifications/repository/NotificationRepo";
import { UserRepo } from "../user/repository/UserRepo";
import { ErrorFactory } from "../utils/ErrorUtil";
import { makeFavorite } from "./dto/FavoriteFireModel";
import { FavoriteRepo } from "./repository/FavoriteRepo";

type FavoriteDeps = {
  favoriteRepo: FavoriteRepo;
  nadeRepo: NadeRepo;
  userRepo: UserRepo;
  notificationRepo: NotificationRepo;
};

export class FavoriteService {
  private favoriteRepo: FavoriteRepo;
  private nadeRepo: NadeRepo;
  private userRepo: UserRepo;
  private notificationRepo: NotificationRepo;

  constructor(deps: FavoriteDeps) {
    const { favoriteRepo, nadeRepo, notificationRepo, userRepo } = deps;
    this.favoriteRepo = favoriteRepo;
    this.nadeRepo = nadeRepo;
    this.notificationRepo = notificationRepo;
    this.userRepo = userRepo;
  }

  getFavoritesForUser = async (steamId: string) => {
    const favorites = await this.favoriteRepo.byUser(steamId);
    Logger.verbose("FavoriteService.getFavoritesForUser", steamId);

    return favorites;
  };

  addFavorite = async (steamId: string, nadeId: string) => {
    const nadeBeingFavorited = await this.nadeRepo.getById(nadeId);

    if (!nadeBeingFavorited) {
      throw ErrorFactory.NotFound("Nade not found");
    }

    const userFavoriting = await this.userRepo.byId(steamId);

    if (!userFavoriting) {
      throw ErrorFactory.NotFound("User not found");
    }

    const newFavorite = makeFavorite(nadeId, steamId);
    const favorite = await this.favoriteRepo.addFavorite(newFavorite);

    if (favorite) {
      await this.nadeRepo.incrementFavoriteCount(nadeId);

      // Avoid favorite notification for own nades
      if (favorite.userId !== nadeBeingFavorited.steamId) {
        await this.notificationRepo.newFavorite(
          nadeBeingFavorited,
          userFavoriting
        );
        Logger.verbose("FavoriteService.addFavorite", favorite?.nadeId);
      }
    }

    return favorite;
  };

  removeFavorite = async (
    steamId: string,
    favoriteId: string
  ): Promise<void> => {
    const allowUnfavorite = await this.isOwnerOfFavorite(steamId, favoriteId);

    if (!allowUnfavorite) {
      throw ErrorFactory.Forbidden("You can't unfavorite this item.");
    }

    const favorite = await this.favoriteRepo.removeFavorite(favoriteId);

    if (!favorite) {
      throw ErrorFactory.NotFound("Favorite not found.");
    }

    const nadeBeingUnFavorited = await this.nadeRepo.getById(favorite.nadeId);

    if (!nadeBeingUnFavorited) {
      throw ErrorFactory.NotFound("Nade not found.");
    }

    Logger.verbose("FavoriteService.removeFavorite", favorite.nadeId);

    if (favorite.userId !== nadeBeingUnFavorited.steamId) {
      await this.notificationRepo.removeFavoriteNotification({
        nadeId: favorite.nadeId,
        bySteamId: steamId,
      });
    }

    await this.nadeRepo.decrementFavoriteCount(favorite.nadeId);
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
