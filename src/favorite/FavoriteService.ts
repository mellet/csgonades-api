import { IFavoriteRepo } from "./FavoriteRepo";
import { makeFavorite } from "./Favorite";
import { ErrorGenerator } from "../utils/ErrorUtil";

export class FavoriteService {
  private favoriteRepo: IFavoriteRepo;
  constructor(favRepo: IFavoriteRepo) {
    this.favoriteRepo = favRepo;
  }

  async getFavoritesForUser(steamId: string) {
    const favorites = await this.favoriteRepo.getUserFavorites(steamId);
    return favorites;
  }

  async createFavoriteForUser(steamId: string, nadeId: string) {
    const newFavorite = makeFavorite(nadeId, steamId);
    const favorite = await this.favoriteRepo.setFavorite(newFavorite);
    return favorite;
  }

  async unFavorite(steamId: string, favoriteId: string) {
    const allowUnfavorite = await this.isOwnerOfFavorite(steamId, favoriteId);

    if (!allowUnfavorite) {
      return ErrorGenerator.FORBIDDEN(
        "Can't unfavorite since your not the owner of this favorite"
      );
    }

    const favorite = await this.favoriteRepo.unFavorite(favoriteId);

    return favorite;
  }

  private async isOwnerOfFavorite(
    steamId: string,
    favoriteId: string
  ): Promise<boolean> {
    const result = await this.favoriteRepo.getFavorite(favoriteId);

    if (result.isErr()) {
      return false;
    }

    const favorite = result.value;

    if (favorite.userId === steamId) {
      return true;
    }

    return false;
  }
}
