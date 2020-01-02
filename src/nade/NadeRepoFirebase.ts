import { NadeRepo } from "./NadeRepo";
import { ok, err } from "neverthrow";
import {
  CsgoMap,
  NadeModel,
  NadeCreateModel,
  NadeModelInsert,
  NadeStats
} from "./Nade";
import { firestore } from "firebase-admin";
import {
  extractFirestoreData,
  extractFirestoreDataPoint
} from "../utils/Firebase";
import { AppResult, removeUndefines } from "../utils/Common";
import { ErrorGenerator, extractError } from "../utils/ErrorUtil";
import { NadeFilter } from "./NadeFilter";
import { UserLightModel } from "../user/UserModel";

export class NadeRepoFirebase implements NadeRepo {
  private collection: firestore.CollectionReference;
  private db: FirebaseFirestore.Firestore;

  constructor(db: FirebaseFirestore.Firestore) {
    this.db = db;
    this.collection = db.collection("nades");
  }

  async get(limit?: number): AppResult<NadeModel[]> {
    try {
      let docRef = this.collection
        .where("status", "==", "accepted")
        .orderBy("createdAt", "desc");

      if (limit) {
        docRef = docRef.limit(limit);
      }

      const querySnap = await docRef.get();
      const nades = await extractFirestoreData<NadeModel>(querySnap);

      return nades;
    } catch (error) {
      return extractError(error);
    }
  }

  async getPending(): AppResult<NadeModel[]> {
    try {
      const nadesRef = this.collection
        .where("status", "==", "pending")
        .orderBy("createdAt", "desc");
      const querySnap = await nadesRef.get();
      const nades = await extractFirestoreData<NadeModel>(querySnap);
      return nades;
    } catch (error) {
      return extractError(error);
    }
  }

  async listByIds(ids: string[]): AppResult<NadeModel[]> {
    try {
      const docRef = this.collection
        .where("id", "in", ids)
        .orderBy("createdAt", "desc");
      const querySnap = await docRef.get();
      const nades = extractFirestoreData<NadeModel>(querySnap);
      return nades;
    } catch (error) {
      return extractError(error);
    }
  }

  async byID(nadeId: string): AppResult<NadeModel> {
    try {
      const docSnap = await this.collection.doc(nadeId).get();

      if (!docSnap.exists) {
        return ErrorGenerator.NOT_FOUND("User");
      }

      const nade = await extractFirestoreDataPoint<NadeModel>(docSnap);

      return nade;
    } catch (error) {
      return extractError(error);
    }
  }

  async byMap(
    mapName: CsgoMap,
    nadeFilter: NadeFilter
  ): AppResult<NadeModel[]> {
    try {
      let docRef = this.collection
        .where("map", "==", mapName)
        .where("status", "==", "accepted")
        .orderBy("createdAt", "desc");

      if (nadeFilter.flash) {
        docRef = docRef.where("type", "==", "flash");
      }

      if (nadeFilter.smoke) {
        docRef = docRef.where("type", "==", "smoke");
      }

      if (nadeFilter.molotov) {
        docRef = docRef.where("type", "==", "molotov");
      }

      if (nadeFilter.hegrenade) {
        docRef = docRef.where("type", "==", "hegrenade");
      }

      const querySnap = await docRef.get();
      const nades = await extractFirestoreData<NadeModel>(querySnap);

      return nades;
    } catch (error) {
      return extractError(error);
    }
  }

  async byUser(steamId: string): AppResult<NadeModel[]> {
    try {
      const docRef = this.collection.where("steamId", "==", steamId);
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

      const nadeDocRef = await this.collection.add(cleanNade);
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
      await this.collection.doc(nadeId).set(cleanUpdates, { merge: true });

      const result = await this.byID(nadeId);
      return result;
    } catch (error) {
      return extractError(error);
    }
  }

  async delete(nadeId: string): AppResult<boolean> {
    try {
      const nadeRef = this.collection.doc(nadeId);
      await nadeRef.delete();
      return ok(true);
    } catch (error) {
      return extractError(error);
    }
  }

  async updateUserOnNades(
    steamId: string,
    user: UserLightModel
  ): AppResult<boolean> {
    try {
      const nadeDocs = await this.collection
        .where("steamId", "==", steamId)
        .get();
      let batch = this.db.batch();

      nadeDocs.forEach(docSnap => {
        const docRef = this.collection.doc(docSnap.id);
        let update: Partial<NadeModel> = { user };
        batch.set(docRef, update, { merge: true });
      });

      await batch.commit();

      return ok(true);
    } catch (error) {
      return extractError(error);
    }
  }

  async updateStats(
    nadeId: string,
    stats: Partial<NadeStats>
  ): AppResult<NadeModel> {
    try {
      const nade = await this.byID(nadeId);

      if (nade.isErr()) {
        console.error("Could not find nade to update stats for");
        return;
      }

      const newStats: NadeStats = {
        ...nade.value.stats,
        ...stats
      };

      const updates: Partial<NadeModel> = {
        stats: newStats,
        lastGfycatUpdate: firestore.Timestamp.fromDate(new Date())
      };

      const nadeRef = this.collection.doc(nadeId);

      await nadeRef.update(updates);

      return this.byID(nadeId);
    } catch (error) {
      console.error(error);
    }
  }
}
