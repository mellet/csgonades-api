import { collection, Collection, get, set, update, value } from "typesaurus";
import { ModelUpdate } from "typesaurus/update";
import { removeUndefines } from "../utils/Common";
import { ErrorFactory } from "../utils/ErrorUtil";
import { UserCreateDTO, UserDTO, UserUpdateDTO } from "./UserDTOs";
import { UserModel } from "./UserModel";

export type UserFilter = {
  limit?: number;
  page?: number;
  byActivity?: boolean;
};

export class UserRepo {
  private collection: Collection<UserModel>;
  private db: FirebaseFirestore.Firestore;

  constructor(db: FirebaseFirestore.Firestore) {
    this.collection = collection<UserModel>("users");
    this.db = db;
  }

  all = async (filter: UserFilter): Promise<UserDTO[]> => {
    const userFilter = {
      ...filter,
      limit: filter.limit || 5,
      page: filter.page || 1
    };

    let offset = userFilter.limit * (userFilter.page - 1);

    // First page of users
    let query = this.db
      .collection("users")
      .orderBy(userFilter.byActivity ? "lastActive" : "createdAt", "desc")
      .offset(offset)
      .limit(userFilter.limit);

    let querySnap = await query.get();

    let userDocs: UserModel[] = [];

    querySnap.forEach(snap => {
      const userDoc = snap.data();
      const userModel: UserModel = {
        createdAt: userDoc.createdAt.toDate(),
        updatedAt: userDoc.updatedAt.toDate(),
        avatar: userDoc.avatar,
        lastActive: userDoc.lastActive.toDate(),
        nickname: userDoc.nickname,
        role: userDoc.role,
        steamId: userDoc.steamId,
        bio: userDoc.bio,
        email: userDoc.email
      };
      userDocs.push(userModel);
    });

    const users = userDocs.map(
      (userDoc): UserDTO => ({
        steamId: userDoc.steamId,
        nickname: userDoc.nickname,
        avatar: userDoc.avatar,
        createdAt: userDoc.createdAt,
        lastActive: userDoc.lastActive,
        role: userDoc.role,
        updatedAt: userDoc.updatedAt,
        bio: userDoc.bio,
        email: userDoc.email
      })
    );

    return users;
  };

  byId = async (steamId: string): Promise<UserModel> => {
    const userDoc = await get(this.collection, steamId);

    if (!userDoc) {
      throw ErrorFactory.NotFound("User not found");
    }

    return userDoc.data;
  };

  create = async (userCreate: UserCreateDTO): Promise<UserModel> => {
    const userModel: UserModel = {
      ...userCreate,
      createdAt: value("serverDate"),
      updatedAt: value("serverDate"),
      lastActive: value("serverDate")
    };

    const user = await set(this.collection, userCreate.steamId, userModel);

    return user.data;
  };

  update = async (
    steamId: string,
    updateFields: UserUpdateDTO
  ): Promise<UserModel | null> => {
    let updateModel: ModelUpdate<UserModel> = {
      nickname: updateFields.nickname
        ? updateFields.nickname.replace(/[^A-Za-z0-9]/g, "")
        : undefined,
      email: updateFields.email,
      bio: updateFields.bio,
      createdAt: updateFields.createdAt
        ? new Date(updateFields.createdAt)
        : undefined
    };

    updateModel = removeUndefines(updateModel);

    await update(this.collection, steamId, updateModel);

    return this.byId(steamId);
  };

  updateActivity = async (steamId: string) => {
    await update(this.collection, steamId, {
      lastActive: value("serverDate")
    });
  };
}
