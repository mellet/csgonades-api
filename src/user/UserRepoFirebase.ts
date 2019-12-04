import { UserRepo } from "./UserRepo";
import {
  CSGNUser,
  convertUserFromFirebase,
  CSGNUserDoc,
  convertUserToFirebase
} from "./User";
import { firestore } from "firebase-admin";

export const makeUserRepo = (db: FirebaseFirestore.Firestore): UserRepo => {
  const COLLECTION_NAME = "users";
  const collectionRef = db.collection(COLLECTION_NAME);

  const bySteamID = async (steamId: string): Promise<CSGNUser> => {
    try {
      const userRef = collectionRef.doc(steamId);
      const userDocSnap = await userRef.get();

      if (!userDocSnap.exists) {
        return null;
      }

      const userDoc = userDocSnap.data() as CSGNUserDoc;
      const user = convertUserFromFirebase(userDoc);
      return user;
    } catch (error) {
      console.error(`Failed userRepo.bySteamID: ${error.message}`);
      return null;
    }
  };

  const createUser = async (user: CSGNUser): Promise<CSGNUser> => {
    try {
      const userDoc = convertUserToFirebase(user);
      await collectionRef.doc(userDoc.steamID).set(userDoc);
      return user;
    } catch (error) {
      console.error("UserRepo.createUser", error);
      throw new Error("Failed to create user.");
    }
  };

  const updateActivity = async (user: CSGNUser) => {
    const now = new Date();
    try {
      await collectionRef
        .doc(user.steamID)
        .update({ lastActive: firestore.Timestamp.fromDate(now) });
    } catch (error) {
      console.error("UserRepo.updateActivity", error);
    }
  };

  return {
    bySteamID,
    createUser,
    updateActivity
  };
};
