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
import { FavoriteCreateModel, FavoriteDTO, FavoriteModel } from "./Favorite";

export class FavoriteRepo {
  private collection: Collection<FavoriteModel>;

  constructor() {
    this.collection = collection("favorites");
  }

  set = async (favorite: FavoriteCreateModel): Promise<FavoriteDTO> => {
    const newFavorite: FavoriteModel = {
      ...favorite,
      createdAt: value("serverDate")
    };

    const favDoc = await add(this.collection, newFavorite);

    return this.docToDto(favDoc);
  };

  unSet = async (favoriteId: string): Promise<FavoriteDTO | null> => {
    const favorite = this.byId(favoriteId);
    await remove(this.collection, favoriteId);

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

  byNadeId = async (nadeId: string): Promise<FavoriteDTO[]> => {
    const docs = await query(this.collection, [where("nadeId", "==", nadeId)]);
    const favs = docs.map(this.docToDto);
    return favs;
  };

  newToday = async (): Promise<FavoriteDTO[]> => {
    // Get all between yesterday 6AM and today 6AM
    const date = new Date();
    date.setDate(date.getDate() - 1);
    date.setHours(6, 0, 0, 0);

    const docs = await query(this.collection, [where("createdAt", ">", date)]);
    const favorites = docs.map(this.docToDto);

    return favorites;
  };

  private docToDto = (doc: Doc<FavoriteModel>): FavoriteDTO => {
    return {
      ...doc.data,
      id: doc.ref.id
    };
  };
}
