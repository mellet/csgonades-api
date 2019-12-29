import { IUserRepo } from "./UserRepo";
import { UserModel, UserCreateModel } from "./UserModel";
import { firestore } from "firebase-admin";
import { ok, err } from "neverthrow";
import {
  extractFirestoreData,
  extractFirestoreDataPoint
} from "../utils/Firebase";
import { AppResult } from "../utils/Common";
import { extractError, ErrorGenerator } from "../utils/ErrorUtil";

export class UserRepo implements IUserRepo {
  private collection: firestore.CollectionReference;

  constructor(db: FirebaseFirestore.Firestore) {
    const COLLECTION_NAME = "users";
    this.collection = db.collection(COLLECTION_NAME);
  }

  async bySteamID(steamId: string): AppResult<UserModel> {
    try {
      const userRef = this.collection.doc(steamId);
      const userDocSnap = await userRef.get();

      if (!userDocSnap.exists) {
        return ErrorGenerator.NOT_FOUND("User");
      }

      const user = extractFirestoreDataPoint<UserModel>(userDocSnap);

      return user;
    } catch (error) {
      return extractError(error);
    }
  }

  async all(limit: number = 10): AppResult<UserModel[]> {
    try {
      const usersRef = this.collection.limit(limit);
      const usersDocSnap = await usersRef.get();
      const users = extractFirestoreData<UserModel>(usersDocSnap);

      return users;
    } catch (error) {
      return extractError(error);
    }
  }

  async createUser(user: UserCreateModel): AppResult<UserModel> {
    try {
      const model = {
        ...user,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        lastActive: firestore.FieldValue.serverTimestamp()
      };

      await this.collection.doc(user.steamId).set(model);

      const savedUser = await this.bySteamID(model.steamId);

      return savedUser;
    } catch (error) {
      return extractError(error);
    }
  }

  async updateActivity(user: UserModel): AppResult<boolean> {
    try {
      await this.collection
        .doc(user.steamId)
        .update({ lastActive: firestore.FieldValue.serverTimestamp });

      return ok(true);
    } catch (error) {
      return extractError(error);
    }
  }
}
