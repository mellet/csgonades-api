import { NadeRepo } from "./NadeRepo";
import { Nade, CsgoMap } from "./Nade";

class NadeRepoFirebase implements NadeRepo {
  private COLLECTION: string = "nades";
  private db: FirebaseFirestore.Firestore;
  constructor(db: FirebaseFirestore.Firestore) {
    this.db = db;
  }

  get = async (limit: number = 10): Promise<Nade[]> => {
    const docRef = this.db.collection(this.COLLECTION).limit(limit);
    const querySnap = await docRef.get();
    let nades: Nade[] = [];

    querySnap.forEach(item => {
      const nade = item.data() as Nade;
      nades.push(nade);
    });

    return nades;
  };

  byID = async (nadeID: string): Promise<Nade> => {
    const docRef = this.db.collection(this.COLLECTION).doc(nadeID);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return null;
    }
    return docSnap.data() as Nade;
  };

  byMap = async (mapName: CsgoMap): Promise<Nade[]> => {
    const docRef = this.db
      .collection(this.COLLECTION)
      .where("map", "==", mapName);

    const querySnap = await docRef.get();
    let nades: Nade[] = [];
    querySnap.forEach(docSnap => {
      const nade = docSnap.data() as Nade;
      nades.push(nade);
    });

    return nades;
  };

  save = async (nade: Nade): Promise<Nade> => {
    try {
      await this.db.collection(this.COLLECTION).add(nade);
      return nade;
    } catch (error) {
      return null;
    }
  };
}

export const makeNadeRepo = (db: FirebaseFirestore.Firestore): NadeRepo => {
  return new NadeRepoFirebase(db);
};
