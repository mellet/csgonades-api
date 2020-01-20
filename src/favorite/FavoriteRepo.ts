import {
  add,
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

  newToday = async (): Promise<FavoriteDTO[]> => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(0, 0, 0, 0);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);

    const yesterDay = new Date();
    yesterDay.setHours(0, 0, 0, 0);

    const docs = await query(this.collection, [
      where("createdAt", ">", twoDaysAgo),
      where("createdAt", "<=", yesterDay)
    ]);
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
