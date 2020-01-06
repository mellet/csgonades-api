import {
  collection,
  Collection,
  value,
  update,
  get,
  query,
  order,
  set,
  limit,
  Query,
  all
} from "typesaurus";
import { UserModel } from "./UserModel";
import { UserCreateDTO, UserUpdateDTO, UserDTO } from "./UserDTOs";
import { removeUndefines } from "../utils/Common";
import { ModelUpdate } from "typesaurus/update";

export type UserFilter = {
  limit?: number;
  byActivity?: boolean;
};

export class UserRepo {
  private collection: Collection<UserModel>;

  constructor() {
    this.collection = collection<UserModel>("users");
  }

  all = async (filter?: UserFilter): Promise<UserDTO[]> => {
    const queryBuilder: Query<UserModel, keyof UserModel>[] = [];

    if (!filter) {
      queryBuilder.push(order("createdAt", "desc"));
    }

    if (filter?.byActivity) {
      queryBuilder.push(order("lastActive", "desc"));
    }

    if (filter?.limit) {
      queryBuilder.push(limit(filter.limit));
    }

    const usersDocs = await query(this.collection, queryBuilder);

    const users = usersDocs.map(
      (userDoc): UserDTO => ({
        steamId: userDoc.data.steamId,
        nickname: userDoc.data.nickname,
        avatar: userDoc.data.avatar,
        createdAt: userDoc.data.createdAt,
        lastActive: userDoc.data.lastActive,
        role: userDoc.data.role,
        updatedAt: userDoc.data.updatedAt,
        bio: userDoc.data.bio,
        email: userDoc.data.email
      })
    );

    return users;
  };

  byId = async (steamId: string): Promise<UserModel | null> => {
    const userDoc = await get(this.collection, steamId);

    if (!userDoc) {
      return null;
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
      nickname: updateFields.nickname,
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
