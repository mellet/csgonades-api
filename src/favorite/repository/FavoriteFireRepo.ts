import {
  add,
  batch,
  collection,
  Collection,
  Doc,
  get,
  query,
  remove,
  value,
  where,
} from "typesaurus";
import { AddModel } from "typesaurus/add";
import { Logger } from "../../logger/Logger";
import { ErrorFactory } from "../../utils/ErrorUtil";
import { FavoriteCreateModel } from "../dto/FavoriteCreateModel";
import { FavoriteDto } from "../dto/FavoriteDto";
import { FavoriteFireModel } from "../dto/FavoriteFireModel";
import { FavoriteRepo } from "./FavoriteRepo";

export class FavoriteFireRepo implements FavoriteRepo {
  private collection: Collection<FavoriteFireModel>;

  constructor() {
    this.collection = collection("favorites");
  }

  addFavorite = async (
    favorite: FavoriteCreateModel
  ): Promise<FavoriteDto | null> => {
    try {
      const duplicate = await query(this.collection, [
        where("nadeId", "==", favorite.nadeId),
        where("userId", "==", favorite.userId),
      ]);

      if (duplicate.length) {
        throw ErrorFactory.BadRequest(
          "This nade is allready favorited by you."
        );
      }

      const newFavorite: AddModel<FavoriteFireModel> = {
        ...favorite,
        createdAt: value("serverDate"),
      };

      const favRef = await add(this.collection, newFavorite);

      return this.byId(favRef.id);
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to addFavorite");
    }
  };

  removeFavorite = async (favoriteId: string): Promise<FavoriteDto | null> => {
    try {
      const favorite = await this.byId(favoriteId);

      if (favorite) {
        await remove(this.collection, favoriteId);
      }

      return favorite;
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to removeFavorite");
    }
  };

  removeFavoriteForNade = async (
    nadeId: string,
    steamId: string
  ): Promise<void> => {
    try {
      const favorites = await query(this.collection, [
        where("nadeId", "==", nadeId),
        where("userId", "==", steamId),
      ]);

      const idsToRemove = favorites.map((f) => f.ref.id);
      const { commit, remove } = batch();

      idsToRemove.forEach((id) => {
        remove(this.collection, id);
      });

      await commit();
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to reomveFavoriteForNade");
    }
  };

  deleteWhereNadeId = async (nadeId: string) => {
    try {
      const favsForNadeId = await this.byNadeId(nadeId);

      const idsToRemove = favsForNadeId.map((f) => f.id);

      const { commit, remove } = batch();

      idsToRemove.forEach((id) => {
        remove(this.collection, id);
      });

      await commit();
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to reomveFavoriteForNade");
    }
  };

  byId = async (favoriteId: string): Promise<FavoriteDto | null> => {
    try {
      const doc = await get(this.collection, favoriteId);

      if (!doc) {
        return null;
      }

      return this.docToDto(doc);
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to get favorite by id");
    }
  };

  byUser = async (steamId: string): Promise<FavoriteDto[]> => {
    try {
      const docs = await query(this.collection, [
        where("userId", "==", steamId),
      ]);

      const favorites = docs.map(this.docToDto);

      return favorites;
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to get favorites by user");
    }
  };

  private byNadeId = async (nadeId: string): Promise<FavoriteDto[]> => {
    try {
      const docs = await query(this.collection, [
        where("nadeId", "==", nadeId),
      ]);
      const favs = docs.map(this.docToDto);
      return favs;
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError(
        "Failed to get favorites by nade id"
      );
    }
  };

  private docToDto = (doc: Doc<FavoriteFireModel>): FavoriteDto => {
    return {
      ...doc.data,
      id: doc.ref.id,
    };
  };
}
