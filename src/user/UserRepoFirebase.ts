import { UserRepo } from "./UserRepo";
import { User } from "./User";
import { makeFirestore } from "../storage/FirebaseFirestore";

class UserRepoFirebase implements UserRepo {
  private collectionName: string = "users";

  private db: FirebaseFirestore.Firestore;

  constructor(db: FirebaseFirestore.Firestore) {
    this.db = db;
  }

  bySteamID = async (steamID: string): Promise<User | null> => {
    const userRef = this.db.collection(this.collectionName).doc(steamID);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return null;
    }

    const user = userDoc.data() as User;

    return user;
  };

  createUser = async (user: User): Promise<User> => {
    try {
      await this.db
        .collection(this.collectionName)
        .doc(user.steamID)
        .set(user);
    } catch (error) {
      console.error(error);
    }
    return user;
  };
}

export const makeUserRepo = (db: FirebaseFirestore.Firestore): UserRepo => {
  return new UserRepoFirebase(db);
};
