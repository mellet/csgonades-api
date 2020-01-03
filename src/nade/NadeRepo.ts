import {
  collection,
  add,
  Collection,
  value,
  update,
  get,
  query,
  limit,
  order,
  Doc,
  getMany,
  where,
  remove,
  batch
} from "typesaurus";
import {
  NadeModel,
  NadeDTO,
  NadeLightDTO,
  CsgoMap,
  NadeCreateModel
} from "./Nade";
import { NadeFilter } from "./NadeFilter";
import { removeUndefines } from "../utils/Common";
import { UserLightModel } from "../user/UserModel";

export class NadeRepo {
  private collection: Collection<NadeModel>;

  constructor() {
    this.collection = collection("nades");
  }

  getAll = async (nadeLimit: number = 0): Promise<NadeLightDTO[]> => {
    const nadesDocs = await query(this.collection, [
      order("createdAt", "desc"),
      nadeLimit && limit(nadeLimit)
    ]);

    const nades = nadesDocs.map(this.toNadeDtoLight);

    return nades;
  };

  pending = async (): Promise<NadeLightDTO[]> => {
    const pendingDocs = await query(this.collection, [
      where("status", "==", "pending"),
      order("createdAt", "desc")
    ]);

    const pendingNades = pendingDocs.map(this.toNadeDtoLight);
    return pendingNades;
  };

  byId = async (nadeId: string): Promise<NadeDTO> => {
    const nadeDoc = await get(this.collection, nadeId);

    if (!nadeDoc) {
      return null;
    }

    return {
      ...nadeDoc.data,
      id: nadeDoc.ref.id
    };
  };

  byMap = async (
    csgoMap: CsgoMap,
    nadeFilter?: NadeFilter
  ): Promise<NadeLightDTO[]> => {
    const nadeDocs = await query(this.collection, [
      where("status", "==", "accepted"),
      where("map", "==", csgoMap),
      nadeFilter?.flash && where("type", "==", "flash"),
      nadeFilter?.smoke && where("type", "==", "smoke"),
      nadeFilter?.molotov && where("type", "==", "molotov"),
      nadeFilter?.hegrenade && where("type", "==", "hegrenade"),
      order("createdAt", "desc")
    ]);

    const nades = nadeDocs.map(this.toNadeDtoLight);
    return nades;
  };

  byUser = async (steamId: string): Promise<NadeLightDTO[]> => {
    const nadeDocs = await query(this.collection, [
      where("steamId", "==", steamId),
      order("createdAt", "desc")
    ]);

    const nades = nadeDocs.map(this.toNadeDtoLight);
    return nades;
  };

  list = async (ids: string[]): Promise<NadeLightDTO[]> => {
    const nadeDocs = await getMany(this.collection, ids);
    const nades = nadeDocs.map(this.toNadeDtoLight);

    return nades;
  };

  save = async (nadeCreate: NadeCreateModel): Promise<NadeDTO> => {
    const nadeModel: NadeModel = {
      ...nadeCreate,
      createdAt: value("serverDate"),
      updatedAt: value("serverDate"),
      lastGfycatUpdate: value("serverDate"),
      status: "pending"
    };

    const nade = await add(this.collection, nadeModel);

    return this.toNadeDTO(nade);
  };

  update = async (
    nadeId: string,
    updates: Partial<NadeDTO>
  ): Promise<NadeDTO> => {
    let modelUpdates: Partial<NadeModel> = {
      ...updates
    };

    // If viewcount is updated,
    // set new time so we don't update again for a while
    if (updates.viewCount) {
      modelUpdates = {
        ...modelUpdates,
        lastGfycatUpdate: value("serverDate")
      };
    }

    modelUpdates = removeUndefines(modelUpdates);

    await update(this.collection, nadeId, modelUpdates);

    const nade = await this.byId(nadeId);

    return nade;
  };

  delete = async (nadeId: string) => {
    await remove(this.collection, nadeId);
  };

  updateUserOnNades = async (steamId: string, user: UserLightModel) => {
    const nadeDocsByUser = await query(this.collection, [
      where("steamId", "==", steamId)
    ]);

    const { update, commit } = batch();

    nadeDocsByUser.forEach(doc => {
      update(this.collection, doc.ref.id, {
        steamId: user.steamId,
        user
      });
    });

    await commit();
  };

  incrementFavoriteCount = async (nadeId: string) => {
    return update(this.collection, nadeId, {
      favoriteCount: value("increment", 1)
    });
  };

  decrementFavoriteCount = async (nadeId: string) => {
    return update(this.collection, nadeId, {
      favoriteCount: value("increment", -1)
    });
  };

  private toNadeDtoLight = (doc: Doc<NadeModel>): NadeLightDTO => {
    const {
      tickrate,
      createdAt,
      images,
      gfycat,
      status,
      type,
      title,
      mapSite,
      viewCount,
      favoriteCount
    } = doc.data;
    return {
      id: doc.ref.id,
      tickrate,
      createdAt,
      images,
      gfycat,
      status,
      type,
      mapSite,
      title,
      viewCount,
      favoriteCount
    };
  };

  private toNadeDTO = (doc: Doc<NadeModel>): NadeDTO => {
    return {
      ...doc.data,
      id: doc.ref.id
    };
  };
}
