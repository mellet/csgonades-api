import {
  collection,
  Collection,
  value,
  update,
  get,
  query,
  order,
  set
} from "typesaurus";
import { UserModel } from "./UserModel";
import { UserLightDTO, UserCreateDTO, UserUpdateDTO } from "./UserDTOs";
import { removeUndefines } from "../utils/Common";
import { ModelUpdate } from "typesaurus/update";

export class UserRepo {
  private collection: Collection<UserModel>;

  constructor() {
    this.collection = collection<UserModel>("users");
  }

  all = async (limit: number = 0): Promise<UserLightDTO[]> => {
    const usersDocs = await query(this.collection, [
      order("createdAt", "desc")
    ]);

    const users = usersDocs.map(
      (userDoc): UserLightDTO => ({
        steamId: userDoc.data.steamId,
        nickname: userDoc.data.nickname,
        avatar: userDoc.data.avatar,
        createdAt: userDoc.data.createdAt
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
