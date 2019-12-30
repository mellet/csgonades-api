import { IUserRepo } from "./UserRepo";
import { UserModel, UserCreateModel } from "./UserModel";
import { firestore } from "firebase-admin";
import { ok } from "neverthrow";
import {
  extractFirestoreData,
  extractFirestoreDataPoint
} from "../utils/Firebase";
import { AppResult, removeUndefines } from "../utils/Common";
import { extractError, ErrorGenerator } from "../utils/ErrorUtil";
import { UserUpdateDTO } from "./UserDTOs";

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

  async updateUser(
    steamId: string,
    updateFields: UserUpdateDTO
  ): AppResult<UserModel> {
    try {
      let updates: Partial<UserModel> = {
        nickname: updateFields.nickname,
        bio: updateFields.bio,
        createdAt:
          updateFields.createdAt &&
          firestore.Timestamp.fromDate(updateFields.createdAt),
        email: updateFields.email
      };
      updates = removeUndefines(updates);

      await this.collection.doc(steamId).set(updates, { merge: true });

      const res = this.bySteamID(steamId);

      return res;
    } catch (error) {
      return extractError(error);
    }
  }
}
