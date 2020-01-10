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
  batch,
  Query
} from "typesaurus";
import { NadeModel, NadeDTO, CsgoMap, NadeCreateModel } from "./Nade";
import { removeUndefines } from "../utils/Common";
import { UserLightModel } from "../user/UserModel";
import { ModelUpdate } from "typesaurus/update";

export class NadeRepo {
  private collection: Collection<NadeModel>;

  constructor() {
    this.collection = collection("nades");
  }

  getAll = async (nadeLimit: number = 0): Promise<NadeDTO[]> => {
    const queryBuilder: Query<NadeModel, keyof NadeModel>[] = [
      where("status", "==", "accepted"),
      order("createdAt", "desc")
    ];

    if (nadeLimit) {
      queryBuilder.push(limit(nadeLimit));
    }

    const nadesDocs = await query(this.collection, queryBuilder);

    const nades = nadesDocs.map(this.toNadeDTO);

    return nades;
  };

  pending = async (): Promise<NadeDTO[]> => {
    const pendingDocs = await query(this.collection, [
      where("status", "==", "pending"),
      order("createdAt", "desc")
    ]);

    const pendingNades = pendingDocs.map(this.toNadeDTO);
    return pendingNades;
  };

  byId = async (nadeId: string): Promise<NadeDTO | null> => {
    const nadeDoc = await get(this.collection, nadeId);

    if (!nadeDoc) {
      return null;
    }

    return {
      ...nadeDoc.data,
      id: nadeDoc.ref.id
    };
  };

  byMap = async (csgoMap: CsgoMap): Promise<NadeDTO[]> => {
    const queryBuilder: Query<NadeModel, keyof NadeModel>[] = [
      where("status", "==", "accepted"),
      where("map", "==", csgoMap),
      order("createdAt", "desc")
    ];

    const nadeDocs = await query(this.collection, queryBuilder);

    const nades = nadeDocs.map(this.toNadeDTO);
    return nades;
  };

  byUser = async (steamId: string): Promise<NadeDTO[]> => {
    const nadeDocs = await query(this.collection, [
      where("steamId", "==", steamId),
      order("createdAt", "desc")
    ]);

    const nades = nadeDocs.map(this.toNadeDTO);
    return nades;
  };

  list = async (ids: string[]): Promise<NadeDTO[]> => {
    const nadeDocs = await getMany(this.collection, ids);
    const nades = nadeDocs.map(this.toNadeDTO);

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
    updates: Partial<NadeModel>
  ): Promise<NadeDTO | null> => {
    let modelUpdates: ModelUpdate<NadeModel> = {
      ...updates,
      lastGfycatUpdate: updates.lastGfycatUpdate
        ? value("serverDate")
        : undefined
    };

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

  private toNadeDTO = (doc: Doc<NadeModel>): NadeDTO => {
    return {
      ...doc.data,
      id: doc.ref.id
    };
  };
}
