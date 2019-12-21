import { NadeRepo } from "./NadeRepo";
import { ok, err, Result } from "neverthrow";
import { CsgoMap, NadeModel, NadeCreateModel } from "./Nade";
import { firestore } from "firebase-admin";
import { extractFirestoreData } from "../utils/Firebase";
import { AppError, AppResult, removeUndefines } from "../utils/Common";
import { ErrorGenerator } from "../utils/ErrorUtil";

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
      const appError: AppError = {
        status: 500,
        message: ""
      };
      return err(appError);
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

      const nade = docSnap.data() as NadeModel;

      return ok(nade);
    } catch (error) {
      return err(error);
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
      return err(error);
    }
  }

  async save(nade: NadeCreateModel): AppResult<NadeModel> {
    try {
      const saveNade = {
        ...nade,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      };

      const cleanNade = removeUndefines(saveNade);

      const nadeDocRef = await this.db
        .collection(this.COLLECTION)
        .add(cleanNade);
      await nadeDocRef.update({ id: nadeDocRef.id });

      const savedNade = await this.byID(nadeDocRef.id);

      return savedNade;
    } catch (error) {
      return err(error);
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
      return err(error);
    }
  }
}
