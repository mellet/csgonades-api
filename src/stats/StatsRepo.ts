import { SiteStats } from "./SiteStats";
import { extractFirestoreDataPoint } from "../utils/Firebase";
import { ErrorGenerator } from "../utils/ErrorUtil";
import { firestore } from "firebase-admin";
import { AppResult } from "../utils/Common";

export class StatsRepo {
  private SITE_STATS_REF: firestore.DocumentReference;

  constructor(db: FirebaseFirestore.Firestore) {
    this.SITE_STATS_REF = db.collection("stats").doc("siteStats");
    this.initializeStatsDocIfNotExcisiting();
  }

  async getStats(): AppResult<SiteStats> {
    try {
      const result = await this.SITE_STATS_REF.get();
      return extractFirestoreDataPoint(result);
    } catch (error) {
      console.error(error.message);
      return ErrorGenerator.UNKNOWN(error.message);
    }
  }

  async incrementUserCounter() {
    try {
      await this.SITE_STATS_REF.update({
        numUsers: firestore.FieldValue.increment(1)
      });
    } catch (error) {
      console.error(error);
    }
  }

  async incrementNadeCounter() {
    try {
      this.SITE_STATS_REF.update({
        numNades: firestore.FieldValue.increment(1)
      });
    } catch (error) {
      console.error(error);
    }
  }

  private async initializeStatsDocIfNotExcisiting() {
    const data = await this.SITE_STATS_REF.get();

    if (!data.exists) {
      const blankSiteStats: SiteStats = {
        numNades: 0,
        numUsers: 0
      };
      await this.SITE_STATS_REF.set(blankSiteStats);
    }
  }
}