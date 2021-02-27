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

  addFavorite = async (favorite: FavoriteCreateModel): Promise<FavoriteDto> => {
    const duplicate = await query(this.collection, [
      where("nadeId", "==", favorite.nadeId),
      where("userId", "==", favorite.userId),
    ]);

    if (duplicate.length) {
      throw ErrorFactory.BadRequest("This nade is allready favorited by you.");
    }

    const newFavorite: FavoriteFireModel = {
      ...favorite,
      createdAt: value("serverDate"),
    };

    const favDoc = await add(this.collection, newFavorite);

    return this.docToDto(favDoc);
  };

  removeFavorite = async (favoriteId: string): Promise<FavoriteDto | null> => {
    const favorite = this.byId(favoriteId);

    if (favorite) {
      await remove(this.collection, favoriteId);
    }

    return favorite;
  };

  reomveFavoriteForNade = async (
    nadeId: string,
    steamId: string
  ): Promise<void> => {
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
  };

  deleteWhereNadeId = async (nadeId: string) => {
    const favsForNadeId = await this.byNadeId(nadeId);

    const idsToRemove = favsForNadeId.map((f) => f.id);

    const { commit, remove } = batch();

    idsToRemove.forEach((id) => {
      remove(this.collection, id);
    });

    await commit();
  };

  byId = async (favoriteId: string): Promise<FavoriteDto | null> => {
    const doc = await get(this.collection, favoriteId);

    if (!doc) {
      return null;
    }

    return this.docToDto(doc);
  };

  byUser = async (steamId: string): Promise<FavoriteDto[]> => {
    const docs = await query(this.collection, [where("userId", "==", steamId)]);

    const favorites = docs.map(this.docToDto);

    return favorites;
  };

  private byNadeId = async (nadeId: string): Promise<FavoriteDto[]> => {
    const docs = await query(this.collection, [where("nadeId", "==", nadeId)]);
    const favs = docs.map(this.docToDto);
    return favs;
  };

  private docToDto = (doc: Doc<FavoriteFireModel>): FavoriteDto => {
    return {
      ...doc.data,
      id: doc.ref.id,
    };
  };
}
