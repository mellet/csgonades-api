import moment from "moment";
import {
  add,
  batch,
  collection,
  Collection,
  Doc,
  get,
  limit,
  order,
  query,
  Query,
  remove,
  update,
  value,
  where,
} from "typesaurus";
import { AddModel } from "typesaurus/add";
import { UpdateModel } from "typesaurus/update";
import { AppCache, IAppCache } from "../../cache/AppCache";
import { Logger } from "../../logger/Logger";
import { UserLightModel } from "../../user/UserModel";
import { removeUndefines } from "../../utils/Common";
import { ErrorFactory } from "../../utils/ErrorUtil";
import { NadeCreateModel } from "../dto/NadeCreateModel";
import { NadeDto } from "../dto/NadeDto";
import { NadeFireModel } from "../dto/NadeFireModel";
import { CsgoMap } from "../nadeSubTypes/CsgoMap";
import { NadeType } from "../nadeSubTypes/NadeType";
import { NadeRepo } from "./NadeRepo";

export class NadeFireRepo implements NadeRepo {
  private collection: Collection<NadeFireModel>;
  private cache: IAppCache;
  private mapNadeCache: IAppCache;

  constructor() {
    const oneHourTtl = 60 * 60 * 1;
    const twelveHourTttl = 60 * 60 * 12;

    this.collection = collection("nades");
    this.cache = new AppCache(twelveHourTttl);
    this.mapNadeCache = new AppCache(oneHourTtl);
  }

  isSlugAvailable = async (slug: string): Promise<boolean> => {
    try {
      const nadeDocs = await query(this.collection, [
        where("slug", "==", slug),
      ]);

      return nadeDocs.length === 0;
    } catch (error) {
      Logger.error("NadeRepo.isSlugAvailable", error);
      throw ErrorFactory.InternalServerError("Failed to check nade slug");
    }
  };

  getAll = async (nadeLimit?: number): Promise<NadeDto[]> => {
    try {
      const queryBuilder: Query<NadeFireModel, keyof NadeFireModel>[] = [
        where("status", "==", "accepted"),
        order("createdAt", "desc"),
      ];

      if (nadeLimit) {
        queryBuilder.push(limit(nadeLimit));
      }

      const nadesDocs = await query(this.collection, queryBuilder);

      const nades = nadesDocs.map(this.toNadeDTO);

      return nades;
    } catch (error) {
      Logger.error("NadeFireRepo.isSlugAvailable", error);
      throw ErrorFactory.InternalServerError("Failed get all nades");
    }
  };

  getPending = async (): Promise<NadeDto[]> => {
    try {
      const pendingDocs = await query(this.collection, [
        where("status", "==", "pending"),
        order("createdAt", "desc"),
      ]);

      const pendingNades = pendingDocs.map(this.toNadeDTO);
      return pendingNades;
    } catch (error) {
      Logger.error("NadeFireRepo.getPending", error);
      throw ErrorFactory.InternalServerError("Failed get pending andes");
    }
  };

  getDeclined = async (): Promise<NadeDto[]> => {
    try {
      const declinedDocs = await query(this.collection, [
        where("status", "==", "declined"),
        order("createdAt", "desc"),
      ]);

      const declinedNades = declinedDocs.map(this.toNadeDTO);
      return declinedNades;
    } catch (error) {
      Logger.error("NadeFireRepo.getDeclined", error);
      throw ErrorFactory.InternalServerError("Failed get declined nades");
    }
  };

  getDeleted = async (): Promise<NadeDto[]> => {
    try {
      const declinedDocs = await query(this.collection, [
        where("status", "==", "deleted"),
        order("createdAt", "desc"),
        limit(10),
      ]);

      return declinedDocs.map(this.toNadeDTO);
    } catch (error) {
      Logger.error("NadeFireRepo.getDeleted", error);
      throw ErrorFactory.InternalServerError("Failed get deleted nades");
    }
  };

  getById = async (nadeId: string): Promise<NadeDto | null> => {
    try {
      const nadeDoc = await get(this.collection, nadeId);

      return nadeDoc ? this.toNadeDTO(nadeDoc) : null;
    } catch (error) {
      Logger.error("NadeFireRepo.getById", error);
      throw ErrorFactory.InternalServerError("Failed get nade with id");
    }
  };

  getBySlug = async (slug: string): Promise<NadeDto | null> => {
    const cacheKey = `nade/${slug}`;
    try {
      const cachedNade = this.cache.get<NadeDto>(cacheKey);
      if (cachedNade) {
        Logger.verbose(`NadeRepo.getBySlug - ${slug} | CACHE`);
        return cachedNade;
      }

      const nadeDocs = await query(this.collection, [
        where("slug", "==", slug),
      ]);

      if (!nadeDocs.length) {
        return null;
      }

      const nade = nadeDocs[0];

      const freshNade = await this.getById(nade.ref.id);

      if (freshNade) {
        this.cache.set(cacheKey, freshNade);
      }

      Logger.verbose(`NadeRepo.getBySlug - ${slug} | DB`);

      return freshNade;
    } catch (error) {
      Logger.error("NadeRepo.getBySlug", error);
      throw ErrorFactory.InternalServerError("Failed get nade with slug");
    }
  };

  getByMap = async (
    csgoMap: CsgoMap,
    nadeType?: NadeType
  ): Promise<NadeDto[]> => {
    const cacheKey = ["map", csgoMap, nadeType || ""].join("/");
    const cachedNades = this.mapNadeCache.get<NadeDto[]>(cacheKey);
    if (cachedNades) {
      Logger.verbose(`NadeRepo.getByMap - ${csgoMap}, ${nadeType} | CACHE`);
      return cachedNades;
    }

    const queryBuilder: Query<NadeFireModel, keyof NadeFireModel>[] = [
      where("status", "==", "accepted"),
      where("map", "==", csgoMap),
    ];

    if (nadeType) {
      queryBuilder.push(where("type", "==", nadeType));
    }

    queryBuilder.push(order("createdAt", "desc"));

    const nadeDocs = await query(this.collection, queryBuilder);

    const nades = nadeDocs.map(this.toNadeDTO);

    this.mapNadeCache.set(cacheKey, nades);

    Logger.verbose(`NadeRepo.getByMap - ${csgoMap}, ${nadeType} | DB`);

    return nades;
  };

  getByUser = async (
    steamId: string,
    csgoMap?: CsgoMap
  ): Promise<NadeDto[]> => {
    const queryBuilder: Query<NadeFireModel, keyof NadeFireModel>[] = [
      where("steamId", "==", steamId),
    ];

    if (csgoMap) {
      queryBuilder.push(where("map", "==", csgoMap));
    }

    queryBuilder.push(order("createdAt", "desc"));

    const nadeDocs = await query(this.collection, queryBuilder);

    const allNades = nadeDocs.map(this.toNadeDTO);
    const nades = allNades.filter((n) => n.status !== "deleted");
    return nades;
  };

  save = async (nadeCreate: NadeCreateModel): Promise<NadeDto> => {
    const nadeModel: AddModel<NadeFireModel> = {
      ...nadeCreate,
      createdAt: value("serverDate"),
      updatedAt: value("serverDate"),
      lastGfycatUpdate: value("serverDate"),
      status: "pending",
    };

    const cleanNadeModel = removeUndefines(nadeModel);

    const nade = await add(this.collection, cleanNadeModel);

    const result = await this.byIdAfterSave(nade.id);

    return result;
  };

  update = async (
    nadeId: string,
    updates: Partial<NadeFireModel>,
    setNewUpdateNade?: boolean,
    setNewCreatedAt?: boolean
  ): Promise<NadeDto> => {
    let modelUpdates: UpdateModel<NadeFireModel> = {
      ...updates,
      lastGfycatUpdate: updates.lastGfycatUpdate
        ? value("serverDate")
        : undefined,
      updatedAt: setNewUpdateNade ? value("serverDate") : undefined,
      createdAt: setNewCreatedAt ? value("serverDate") : undefined,
    };

    await update(this.collection, nadeId, removeUndefines(modelUpdates));

    const nade = await this.byIdAfterSave(nadeId);

    if (nade.slug) {
      this.cache.del(nade.slug);
    }

    return nade;
  };

  delete = async (nadeId: string) => {
    await remove(this.collection, nadeId);
  };

  updateUserOnNades = async (steamId: string, user: UserLightModel) => {
    const nadeDocsByUser = await query(this.collection, [
      where("steamId", "==", steamId),
    ]);

    const { update, commit } = batch();

    nadeDocsByUser.forEach((doc) => {
      update(this.collection, doc.ref.id, {
        steamId: user.steamId,
        user: {
          nickname: user.nickname,
          steamId: user.steamId,
          avatar: user.avatar,
        },
      });
      if (doc.data.slug) {
        this.cache.del(doc.data.slug);
      }
    });

    await commit();
  };

  incrementFavoriteCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      favoriteCount: value("increment", 1),
    });

    const nade = await this.byIdAfterSave(nadeId);

    if (nade.slug) {
      this.cache.del(nade.slug);
    }

    return nade;
  };

  decrementFavoriteCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      favoriteCount: value("increment", -1),
    });

    const nade = await this.byIdAfterSave(nadeId);

    if (nade.slug) {
      this.cache.del(nade.slug);
    }

    return nade;
  };

  incrementCommentCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      commentCount: value("increment", 1),
    });

    const nade = await this.byIdAfterSave(nadeId);

    if (nade.slug) {
      this.cache.del(nade.slug);
    }

    return nade;
  };

  decrementCommentCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      commentCount: value("increment", -1),
    });

    const nade = await this.byIdAfterSave(nadeId);

    if (nade.slug) {
      this.cache.del(nade.slug);
    }

    return nade;
  };

  private byIdAfterSave = async (nadeId: string) => {
    const nade = await this.getById(nadeId);
    if (!nade) {
      Logger.error("Failed to get nade after save or update");
      throw ErrorFactory.InternalServerError("Failed to get nade after update");
    }
    return nade;
  };

  private toNadeDTO = (doc: Doc<NadeFireModel>): NadeDto => {
    return {
      ...doc.data,
      id: doc.ref.id,
      score: this.newCalcScore(doc.data),
    };
  };

  private newCalcScore = (nade: NadeFireModel): number => {
    const gravity = 1.3;
    const votes = nade.commentCount + nade.favoriteCount || 1;
    const addedHoursAgo =
      moment().diff(moment(nade.createdAt), "hours", false) + 2;

    const score = (votes / Math.pow(addedHoursAgo, gravity)) * 1000;

    return score;
  };
}
