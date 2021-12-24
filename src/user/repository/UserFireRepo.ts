import { collection, Collection, get, set, update, value } from "typesaurus";
import { AddModel } from "typesaurus/add";
import { UpdateModel } from "typesaurus/update";
import { Logger } from "../../logger/Logger";
import { removeUndefines } from "../../utils/Common";
import { ErrorFactory } from "../../utils/ErrorUtil";
import { UserCreateDto, UserDto, UserUpdateDto } from "../UserDTOs";
import { UserModel } from "../UserModel";
import { UserRepo } from "./UserRepo";

export type UserFilter = {
  limit?: number;
  page?: number;
  byActivity?: boolean;
};

export class UserFireRepo implements UserRepo {
  private collection: Collection<UserModel>;
  private db: FirebaseFirestore.Firestore;

  constructor(db: FirebaseFirestore.Firestore) {
    this.collection = collection<UserModel>("users");
    this.db = db;
  }

  all = async (filter: UserFilter): Promise<UserDto[]> => {
    try {
      const userFilter = {
        ...filter,
        limit: filter.limit || 5,
        page: filter.page || 1,
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

      querySnap.forEach((snap) => {
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
          email: userDoc.email,
          preferredTick: userDoc.preferredTick,
        };
        userDocs.push(userModel);
      });

      const users = userDocs.map(
        (userDoc): UserDto => ({
          steamId: userDoc.steamId,
          nickname: userDoc.nickname,
          avatar: userDoc.avatar,
          createdAt: userDoc.createdAt,
          lastActive: userDoc.lastActive,
          role: userDoc.role,
          updatedAt: userDoc.updatedAt,
          bio: userDoc.bio,
          email: userDoc.email,
          preferredTick: userDoc.preferredTick,
        })
      );

      return users;
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("UserRepo.all");
    }
  };

  byId = async (steamId: string): Promise<UserModel | null> => {
    try {
      const userDoc = await get(this.collection, steamId);

      if (!userDoc) {
        return null;
      }

      Logger.verbose(`UserRepo.byId(${steamId})`);

      return userDoc.data;
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("UserRepo.byId");
    }
  };

  byIdExpected = async (steamId: string): Promise<UserModel> => {
    try {
      const userDoc = await get(this.collection, steamId);

      if (!userDoc) {
        throw ErrorFactory.InternalServerError("UserRepo.byIdExpected");
      }

      Logger.verbose(`UserRepo.byIdExpected(${steamId})`);

      return userDoc.data;
    } catch (error) {
      Logger.error("UserRepo.byIdExpected, user not found");
      throw ErrorFactory.InternalServerError("UserRepo.byIdExpected");
    }
  };

  create = async (userCreate: UserCreateDto): Promise<UserModel> => {
    try {
      const userModel: AddModel<UserModel> = {
        ...userCreate,
        createdAt: value("serverDate"),
        updatedAt: value("serverDate"),
        lastActive: value("serverDate"),
      };

      await set(this.collection, userCreate.steamId, userModel);
      Logger.verbose(`UserRepo.create() -> ${userCreate.nickname}`);

      return this.byIdExpected(userCreate.steamId);
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("UserRepo.byIdExpected");
    }
  };

  update = async (
    steamId: string,
    updateFields: UserUpdateDto
  ): Promise<UserModel> => {
    try {
      let updateModel: UpdateModel<UserModel> = {
        nickname: updateFields.nickname,
        email: updateFields.email,
        bio: updateFields.bio,
        avatar: updateFields.avatar,
        preferredTick: updateFields.preferredTick,
        createdAt: updateFields.createdAt
          ? new Date(updateFields.createdAt)
          : undefined,
      };

      updateModel = removeUndefines(updateModel);

      await update(this.collection, steamId, updateModel);

      Logger.verbose(`UserRepo.update(${steamId})`);

      return this.byIdExpected(steamId);
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("UserRepo.byIdExpected");
    }
  };

  updateActivity = async (steamId: string) => {
    Logger.verbose(`UserRepo.updateActivity(${steamId})`);

    await update(this.collection, steamId, {
      lastActive: value("serverDate"),
    });
  };
}
