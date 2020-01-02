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
import NodeCache = require("node-cache");

export class NadeRepoFirebase implements NadeRepo {
  private db: FirebaseFirestore.Firestore;
  private cache: NodeCache;
  private COLLECTION = "nades";

  constructor(db: FirebaseFirestore.Firestore, cache: NodeCache) {
    this.db = db;
    this.cache = cache;
  }

  async get(limit: number = 10): AppResult<NadeModel[]> {
    const cacheTimer = 60 * 10; // 10 minutes
    const cacheKey = "recentNades";

    const cachedNades = this.cache.get<NadeModel[]>(cacheKey);
    if (cachedNades) {
      return ok(cachedNades);
    }

    try {
      const docRef = this.db
        .collection(this.COLLECTION)
        .limit(limit)
        .where("status", "==", "accepted")
        .orderBy("createdAt", "desc");
      const querySnap = await docRef.get();
      const nades = await extractFirestoreData<NadeModel>(querySnap);

      if (nades.isOk()) {
        console.log("Caching recent nades");
        this.cache.set(cacheKey, nades.value, cacheTimer);
      }

      return nades;
    } catch (error) {
      return extractError(error);
    }
  }

  async listByIds(ids: string[]): AppResult<NadeModel[]> {
    try {
      const docRef = this.db
        .collection(this.COLLECTION)
        .where("id", "in", ids)
        .orderBy("createdAt", "desc");
      const querySnap = await docRef.get();
      const nades = extractFirestoreData<NadeModel>(querySnap);
      return nades;
    } catch (error) {
      return extractError(error);
    }
  }

  async byID(nadeId: string, useCache: boolean = true): AppResult<NadeModel> {
    const cacheTimer = 60 * 10; // 10 minutes
    const cacheKey = `nade-${nadeId}`;
    const cachedNade = this.cache.get<NadeModel>(cacheKey);

    if (useCache && cachedNade) {
      console.log("Had cached nade", nadeId);
      return ok(cachedNade);
    }

    try {
      const docSnap = await this.db
        .collection(this.COLLECTION)
        .doc(nadeId)
        .get();

      if (!docSnap.exists) {
        return ErrorGenerator.NOT_FOUND("User");
      }

      const nade = await extractFirestoreDataPoint<NadeModel>(docSnap);

      if (nade.isOk()) {
        console.log("Caching nade", nadeId);
        this.cache.set<NadeModel>(cacheKey, nade.value, cacheTimer);
      }

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
      const cacheTimer = 60 * 10; // 10 minutes
      const cachkeKey = `nades-${mapName}-${JSON.stringify(nadeFilter)}`;
      const cachedNade = this.cache.get<NadeModel[]>(cachkeKey);

      if (cachedNade) {
        console.log("Had cached nades for map", cachkeKey);
        return ok(cachedNade);
      }

      let docRef = this.db
        .collection(this.COLLECTION)
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

      if (nades.isOk()) {
        console.log("Caching nades", cachkeKey);
        this.cache.set<NadeModel[]>(cachkeKey, nades.value, cacheTimer);
      }

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

      const savedNade = await this.byID(nadeDocRef.id, false);

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

      const result = await this.byID(nadeId, false);
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

  async updateUserOnNades(
    steamId: string,
    user: UserLightModel
  ): AppResult<boolean> {
    try {
      const nadeDocs = await this.db
        .collection(this.COLLECTION)
        .where("steamId", "==", steamId)
        .get();
      let batch = this.db.batch();

      nadeDocs.forEach(docSnap => {
        const docRef = this.db.collection(this.COLLECTION).doc(docSnap.id);
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
      const nade = await this.byID(nadeId, false);

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

      const nadeRef = this.db.collection(this.COLLECTION).doc(nadeId);

      await nadeRef.update(updates);

      return this.byID(nadeId, false);
    } catch (error) {
      console.error(error);
    }
  }
}
