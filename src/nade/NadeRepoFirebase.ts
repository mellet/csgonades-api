import { NadeRepo } from "./NadeRepo";
import { ok } from "neverthrow";
import { CsgoMap, NadeModel, NadeCreateModel, NadeModelInsert } from "./Nade";
import { firestore } from "firebase-admin";
import {
  extractFirestoreData,
  extractFirestoreDataPoint
} from "../utils/Firebase";
import { AppResult, removeUndefines } from "../utils/Common";
import { ErrorGenerator, extractError } from "../utils/ErrorUtil";

export class NadeRepoFirebase implements NadeRepo {
  private db: FirebaseFirestore.Firestore;
  private COLLECTION = "nades";

  constructor(db: FirebaseFirestore.Firestore) {
    this.db = db;
  }

  async get(limit: number = 10): AppResult<NadeModel[]> {
    try {
      const docRef = this.db.collection(this.COLLECTION).limit(limit);
      const querySnap = await docRef.get();
      const nades = extractFirestoreData<NadeModel>(querySnap);

      return nades;
    } catch (error) {
      return extractError(error);
    }
  }

  async listByIds(ids: string[]): AppResult<NadeModel[]> {
    try {
      const docRef = this.db.collection(this.COLLECTION).where("id", "in", ids);
      const querySnap = await docRef.get();
      const nades = extractFirestoreData<NadeModel>(querySnap);
      return nades;
    } catch (error) {
      return extractError(error);
    }
  }

  async byID(nadeId: string): AppResult<NadeModel> {
    try {
      const docSnap = await this.db
        .collection(this.COLLECTION)
        .doc(nadeId)
        .get();

      if (!docSnap.exists) {
        return ErrorGenerator.NOT_FOUND("User");
      }

      const nade = extractFirestoreDataPoint<NadeModel>(docSnap);

      return nade;
    } catch (error) {
      return extractError(error);
    }
  }

  async byMap(mapName: CsgoMap): AppResult<NadeModel[]> {
    try {
      const docRef = this.db
        .collection(this.COLLECTION)
        .where("map", "==", mapName);
      const querySnap = await docRef.get();
      const nades = extractFirestoreData<NadeModel>(querySnap);

      return nades;
    } catch (error) {
      return extractError(error);
    }
  }

  async byUser(steamId: string): AppResult<NadeModel[]> {
    try {
      const docRef = this.db
        .collection(this.COLLECTION)
        .where("steamId", "==", steamId);
      const querySnap = await docRef.get();
      const nades = extractFirestoreData<NadeModel>(querySnap);

      return nades;
    } catch (error) {
      return extractError(error);
    }
  }

  async save(nade: NadeCreateModel): AppResult<NadeModel> {
    try {
      const saveNade: NadeModelInsert = {
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        gfycat: nade.gfycat,
        images: nade.images,
        lastGfycatUpdate: firestore.FieldValue.serverTimestamp(),
        stats: nade.stats,
        status: "pending",
        steamId: nade.steamId,
        user: nade.user
      };

      const cleanNade = removeUndefines(saveNade);

      const nadeDocRef = await this.db
        .collection(this.COLLECTION)
        .add(cleanNade);
      await nadeDocRef.update({ id: nadeDocRef.id });

      const savedNade = await this.byID(nadeDocRef.id);

      return savedNade;
    } catch (error) {
      return extractError(error);
    }
  }

  async update(
    nadeId: string,
    updates: Partial<NadeModel>
  ): AppResult<NadeModel> {
    try {
      const cleanUpdates = removeUndefines(updates);
      await this.db
        .collection(this.COLLECTION)
        .doc(nadeId)
        .set(cleanUpdates, { merge: true });

      const result = await this.byID(nadeId);
      return result;
    } catch (error) {
      return extractError(error);
    }
  }

  async delete(nadeId: string): AppResult<boolean> {
    try {
      const nadeRef = this.db.collection(this.COLLECTION).doc(nadeId);
      await nadeRef.delete();
      return ok(true);
    } catch (error) {
      return extractError(error);
    }
  }
}
