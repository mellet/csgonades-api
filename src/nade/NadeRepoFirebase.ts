import { NadeRepo } from "./NadeRepo";
import {
  CsgoMap,
  Nade,
  convertNadeFromFirebase,
  prepareNadeForFirebase
} from "./Nade";

export const makeNadeRepoFirebase = (
  db: FirebaseFirestore.Firestore
): NadeRepo => {
  const COLLECTION = "nades";

  const get = async (limit: number = 10): Promise<Nade[]> => {
    const docRef = db.collection(COLLECTION).limit(limit);
    const querySnap = await docRef.get();
    let nades: Nade[] = [];

    querySnap.forEach(item => {
      const nade = convertNadeFromFirebase(item.data());
      nades.push(nade);
    });

    return nades;
  };

  const byID = async (nadeID: string): Promise<Nade> => {
    const docSnap = await db
      .collection(COLLECTION)
      .doc(nadeID)
      .get();
    if (!docSnap.exists) {
      console.error(nadeID, "Did not excist");
      return null;
    }
    const data = docSnap.data();
    const nade = convertNadeFromFirebase(data);

    return nade;
  };

  const byMap = async (mapName: CsgoMap): Promise<Nade[]> => {
    const docRef = db.collection(COLLECTION).where("map", "==", mapName);

    const querySnap = await docRef.get();
    let nades: Nade[] = [];
    querySnap.forEach(docSnap => {
      const nade = convertNadeFromFirebase(docSnap.data());
      nades.push(nade);
    });

    return nades;
  };

  const save = async (nade: Nade): Promise<Nade> => {
    const nadeDoc = prepareNadeForFirebase(nade);
    const nadeDocRef = await db.collection(COLLECTION).add(nadeDoc);
    await nadeDocRef.update({ id: nadeDocRef.id });

    const savedNade = await byID(nadeDocRef.id);
    return savedNade;
  };

  const update = async (nade: Nade): Promise<Nade> => {
    const nadeDoc = prepareNadeForFirebase(nade);
    const nadeDocRef = await db
      .collection(COLLECTION)
      .doc(nade.id)
      .set(nade, { merge: true });
    return nade;
  };

  return {
    get,
    byID,
    byMap,
    save,
    update
  };
};
