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
  where
} from "typesaurus";
import { ErrorFactory } from "../utils/ErrorUtil";
import { FavoriteCreateModel, FavoriteDTO, FavoriteModel } from "./Favorite";

export class FavoriteRepo {
  private collection: Collection<FavoriteModel>;

  constructor() {
    this.collection = collection("favorites");
  }

  set = async (favorite: FavoriteCreateModel): Promise<FavoriteDTO> => {
    const duplicate = await query(this.collection, [
      where("nadeId", "==", favorite.nadeId),
      where("userId", "==", favorite.userId)
    ]);

    if (duplicate.length) {
      throw ErrorFactory.BadRequest("This nade is allready favorited by you.");
    }

    const newFavorite: FavoriteModel = {
      ...favorite,
      createdAt: value("serverDate")
    };

    const favDoc = await add(this.collection, newFavorite);

    return this.docToDto(favDoc);
  };

  unSet = async (favoriteId: string): Promise<FavoriteDTO | null> => {
    const favorite = this.byId(favoriteId);

    if (favorite) {
      await remove(this.collection, favoriteId);
    }

    return favorite;
  };

  deleteByNadeId = async (nadeId: string) => {
    const favsForNadeId = await this.byNadeId(nadeId);

    const idsToRemove = favsForNadeId.map(f => f.id);

    const { commit, remove } = batch();

    idsToRemove.forEach(id => {
      remove(this.collection, id);
    });

    await commit();
  };

  byId = async (favoriteId: string): Promise<FavoriteDTO | null> => {
    const doc = await get(this.collection, favoriteId);

    if (!doc) {
      return null;
    }

    return this.docToDto(doc);
  };

  byUser = async (steamId: string): Promise<FavoriteDTO[]> => {
    const docs = await query(this.collection, [where("userId", "==", steamId)]);

    const favorites = docs.map(this.docToDto);

    return favorites;
  };

  private byNadeId = async (nadeId: string): Promise<FavoriteDTO[]> => {
    const docs = await query(this.collection, [where("nadeId", "==", nadeId)]);
    const favs = docs.map(this.docToDto);
    return favs;
  };

  private docToDto = (doc: Doc<FavoriteModel>): FavoriteDTO => {
    return {
      ...doc.data,
      id: doc.ref.id
    };
  };
}
