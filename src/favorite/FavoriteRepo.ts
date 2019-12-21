import { FavoriteCreateModel, FavoriteModel } from "./Favorite";
import { Result, err, ok } from "neverthrow";
import { firestore } from "firebase-admin";
import { extractFirestoreData } from "../utils/Firebase";
import { AppResult } from "../utils/Common";
import { ErrorGenerator } from "../utils/ErrorUtil";

export interface IFavoriteRepo {
  setFavorite(favorite: FavoriteCreateModel): AppResult<FavoriteModel>;
  unFavorite(favoriteId: string): AppResult<boolean>;
  getUserFavorites(steamId: string): AppResult<FavoriteModel[]>;
}

export class FavoriteRepo implements IFavoriteRepo {
  private db: FirebaseFirestore.Firestore;
  private COLLECTION = "favorites";

  constructor(db: FirebaseFirestore.Firestore) {
    this.db = db;
  }

  async setFavorite(favorite: FavoriteCreateModel): AppResult<FavoriteModel> {
    try {
      const favoriteDocRef = await this.db.collection(this.COLLECTION).add({
        ...favorite,
        createdAt: firestore.FieldValue.serverTimestamp()
      });
      await favoriteDocRef.update({ id: favoriteDocRef.id });

      const result = this.getFavorite(favoriteDocRef.id);

      return result;
    } catch (error) {
      return err(error);
    }
  }

  async unFavorite(favoriteId: string): AppResult<boolean> {
    try {
      await this.db
        .collection(this.COLLECTION)
        .doc(favoriteId)
        .delete();
      return ok(true);
    } catch (error) {
      return err(error);
    }
  }

  async getUserFavorites(steamId: string): AppResult<FavoriteModel[]> {
    try {
      const result = await this.db
        .collection(this.COLLECTION)
        .where("steamId", "==", steamId)
        .get();
      const favorites = extractFirestoreData<FavoriteModel>(result);

      return favorites;
    } catch (error) {
      return err(error);
    }
  }

  private async getFavorite(favoriteId: string): AppResult<FavoriteModel> {
    const docSnap = await this.db
      .collection(this.COLLECTION)
      .doc(favoriteId)
      .get();
    if (!docSnap.exists) {
      return ErrorGenerator.NOT_FOUND("Favorite");
    }

    const nade = docSnap.data() as FavoriteModel;

    return ok(nade);
  }
}
