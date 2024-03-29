import {
  add,
  batch,
  collection,
  Collection,
  Doc,
  get,
  getMany,
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
import { ICache } from "../../cache/AppCache";
import { IAppCaches } from "../../cache/initCache";
import { Logger } from "../../logger/Logger";
import { UserLightModel } from "../../user/UserModel";
import { removeUndefines } from "../../utils/Common";
import { ErrorFactory } from "../../utils/ErrorUtil";
import { NadeCreateModel } from "../dto/NadeCreateModel";
import { NadeDto } from "../dto/NadeDto";
import { NadeFireModel } from "../dto/NadeFireModel";
import { CsMap } from "../nadeSubTypes/CsgoMap";
import { GameMode } from "../nadeSubTypes/GameMode";
import { NadeType } from "../nadeSubTypes/NadeType";
import { calculateScore, isNewNade } from "../utils/NadeUtils";
import { NadeRepo, NadeUpdateConfig } from "./NadeRepo";

export class NadeFireRepo implements NadeRepo {
  private collection: Collection<NadeFireModel>;
  private cache: ICache;
  private mapNadeCache: ICache;

  constructor(caches: IAppCaches) {
    this.collection = collection("nades");
    this.cache = caches.longtermCache;
    this.mapNadeCache = caches.shorttermCache;
  }

  getByStartAndEndLocation = async (
    startLocationId: string,
    endLocationId: string
  ): Promise<NadeDto[]> => {
    // TODO: Add caching and cache invalidation

    const result = await query(this.collection, [
      where("mapStartLocationId", "==", startLocationId),
      where("mapEndLocationId", "==", endLocationId),
      where("status", "==", "accepted"),
    ]);

    return result.map(this.toNadeDTO);
  };

  getListOfNades = async (nadeIds: string[]): Promise<NadeDto[]> => {
    const result = await getMany(this.collection, nadeIds);

    const nades = result.map(this.toNadeDTO);

    return nades;
  };

  isSlugAvailable = async (slug: string): Promise<boolean> => {
    try {
      const nadeDocs = await query(this.collection, [
        where("slug", "==", slug),
      ]);

      const slugAvailable = nadeDocs.length === 0;

      Logger.verbose(`NadeRepo.isSlugAvailable() -> ${slugAvailable} | DB`);

      return slugAvailable;
    } catch (error) {
      Logger.error("NadeRepo.isSlugAvailable", error);
      throw ErrorFactory.InternalServerError("Failed to check nade slug");
    }
  };

  getRecent = async (gameMode: GameMode): Promise<NadeDto[]> => {
    const cacheKey = this.recentCacheKey(gameMode);
    const nades = this.mapNadeCache.get<NadeDto[]>(cacheKey);

    if (nades) {
      Logger.verbose(
        `NadeRepo.getRecent(${gameMode}) -> ${nades.length} | CACHE`
      );
      return nades;
    }

    try {
      const queryBuilder: Query<NadeFireModel, keyof NadeFireModel>[] = [
        where("status", "==", "accepted"),
        where("gameMode", "==", gameMode),
        order("createdAt", "desc"),
        limit(12),
      ];

      const nadesDocs = await query(this.collection, queryBuilder);

      const nades = nadesDocs.map(this.toNadeDTO);

      Logger.verbose(`NadeRepo.getRecent(${gameMode}) -> ${nades.length} | DB`);

      this.mapNadeCache.set<NadeDto[]>(cacheKey, nades);
      return nades;
    } catch (error) {
      Logger.error("NadeFireRepo.NadeRepo", error);
      throw ErrorFactory.InternalServerError("Failed get recent nades");
    }
  };

  getPending = async (): Promise<NadeDto[]> => {
    try {
      const pendingDocs = await query(this.collection, [
        where("status", "==", "pending"),
        order("createdAt", "desc"),
      ]);

      const pendingNades = pendingDocs.map(this.toNadeDTO);

      Logger.verbose(`NadeRepo.getPending() -> ${pendingNades.length} | DB`);

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

      Logger.verbose(`NadeRepo.getDeclined() -> ${declinedNades.length} | DB`);

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
        limit(50),
      ]);

      Logger.verbose(`NadeRepo.getDeleted() -> ${declinedDocs.length} | DB`);

      return declinedDocs.map(this.toNadeDTO);
    } catch (error) {
      Logger.error("NadeFireRepo.getDeleted", error);
      throw ErrorFactory.InternalServerError("Failed get deleted nades");
    }
  };

  getDeletedToRemove = async (): Promise<NadeDto[]> => {
    try {
      const deletedToRemove = await query(this.collection, [
        where("status", "==", "deleted"),
        order("createdAt", "asc"),
        limit(100),
      ]);
      return deletedToRemove.map(this.toNadeDTO);
    } catch (error) {
      Logger.error("NadeFireRepo.getDeletedToRemove", error);
      throw ErrorFactory.InternalServerError(
        "Failed get deleted nades to remove"
      );
    }
  };

  getById = async (nadeId: string): Promise<NadeDto | null> => {
    const cachedNade = this.tryGetNadeFromCache({ id: nadeId });
    if (cachedNade) {
      Logger.verbose(`NadeRepo.getById(${nadeId}) | CACHE`);
      return cachedNade;
    }

    try {
      const nadeDoc = await get(this.collection, nadeId);
      Logger.verbose(`NadeRepo.getById(${nadeId}) | DB`);
      const nade = nadeDoc ? this.toNadeDTO(nadeDoc) : null;

      // Set elo score if not set
      if (nadeDoc && !nadeDoc.data.eloScore) {
        this.updateNade(nadeDoc.ref.id, { eloScore: 1450 });
      }

      this.setNadeInCache(nade);

      return nade;
    } catch (error) {
      Logger.error("NadeFireRepo.getById", error);
      throw ErrorFactory.InternalServerError("Failed get nade with id");
    }
  };

  getBySlug = async (slug: string): Promise<NadeDto | null> => {
    const cachedNade = this.tryGetNadeFromCache({ slug: slug });

    if (cachedNade) {
      Logger.verbose(`NadeRepo.getBySlug(${slug}) | CACHE`);
      return cachedNade;
    }

    try {
      const nadeDocs = await query(this.collection, [
        where("slug", "==", slug),
      ]);

      if (!nadeDocs.length) {
        return null;
      }

      const nadeDoc = nadeDocs[0];

      const nade = this.toNadeDTO(nadeDoc);

      Logger.verbose(`NadeRepo.getBySlug(${slug}) | DB`);
      this.setNadeInCache(nade);

      return nade;
    } catch (error) {
      Logger.error("NadeRepo.getBySlug", error);
      throw ErrorFactory.InternalServerError("Failed get nade with slug");
    }
  };

  getByMap = async (
    csgoMap: CsMap,
    nadeType?: NadeType,
    gameMode?: GameMode
  ): Promise<NadeDto[]> => {
    const cacheKey = this.createMapCacheKey(csgoMap, nadeType, gameMode);

    const cachedNades = this.mapNadeCache.get<NadeDto[]>(cacheKey);
    if (cachedNades) {
      Logger.verbose(
        `NadeRepo.getByMap(${csgoMap}, ${nadeType}) -> ${cachedNades.length} | CACHE`
      );
      return cachedNades;
    }

    const queryBuilder: Query<NadeFireModel, keyof NadeFireModel>[] = [
      where("status", "==", "accepted"),
      where("map", "==", csgoMap),
    ];

    if (gameMode) {
      queryBuilder.push(where("gameMode", "==", gameMode));
    }

    if (nadeType) {
      queryBuilder.push(where("type", "==", nadeType));
    }

    queryBuilder.push(order("createdAt", "desc"));

    const nadeDocs = await query(this.collection, queryBuilder);

    const nades = nadeDocs.map(this.toNadeDTO);

    this.mapNadeCache.set(cacheKey, nades);

    Logger.verbose(
      `NadeRepo.getByMap(${csgoMap}, ${nadeType}) -> ${nades.length}| DB`
    );

    return nades;
  };

  getByUser = async (
    steamId: string,
    csgoMap?: CsMap,
    gameMode?: GameMode
  ): Promise<NadeDto[]> => {
    const queryBuilder: Query<NadeFireModel, keyof NadeFireModel>[] = [
      where("steamId", "==", steamId),
    ];

    if (csgoMap) {
      queryBuilder.push(where("map", "==", csgoMap));
    }

    if (gameMode) {
      queryBuilder.push(where("gameMode", "==", gameMode));
    }

    queryBuilder.push(order("createdAt", "desc"));

    const nadeDocs = await query(this.collection, queryBuilder);

    const nades = nadeDocs.map(this.toNadeDTO);

    Logger.verbose(
      `NadeRepo.getByUser(${steamId}, ${csgoMap}, ${gameMode}) -> ${nades.length} | DB`
    );

    return nades;
  };

  save = async (nadeCreate: NadeCreateModel): Promise<NadeDto> => {
    const nadeModel: AddModel<NadeFireModel> = removeUndefines({
      ...nadeCreate,
      createdAt: value("serverDate"),
      updatedAt: value("serverDate"),
      lastGfycatUpdate: value("serverDate"),
      status: "pending",
      eloScore: 1450,
    });

    const cleanNadeModel = removeUndefines(nadeModel);

    const nade = await add(this.collection, cleanNadeModel);

    const result = await this.byIdAfterSave(nade.id);

    Logger.verbose(`NadeRepo.save()`);

    return result;
  };

  updateNade = async (
    nadeId: string,
    updates: Partial<NadeFireModel>,
    config?: NadeUpdateConfig
  ): Promise<NadeDto> => {
    const updateConfig = {
      setNewUpdatedAt: config?.setNewUpdatedAt || false,
      setNewCreatedAt: config?.setNewCreatedAt || false,
      invalidateCache: config?.invalidateCache || false,
    };

    let modelUpdates: UpdateModel<NadeFireModel> = removeUndefines({
      ...updates,
      lastGfycatUpdate: updates.lastGfycatUpdate
        ? value("serverDate")
        : undefined,
      updatedAt: updateConfig.setNewUpdatedAt ? value("serverDate") : undefined,
      createdAt: updateConfig.setNewCreatedAt ? value("serverDate") : undefined,
    });

    await update(this.collection, nadeId, modelUpdates);

    const nade = await this.byIdAfterSave(nadeId);

    this.removeNadeFromCache(nade);
    if (updateConfig.invalidateCache) {
      this.clearRecentAndMapCache(nade);
    }
    Logger.verbose(`NadeRepo.update(${nadeId})`);

    // Clear cache for map nades when slug is created
    if (updates.slug && !nade.slug && nade.status === "accepted") {
      this.clearRecentAndMapCache(nade, { invalidateRecent: true });
    }

    return this.byIdAfterSave(nadeId);
  };

  delete = async (nadeId: string) => {
    const nade = await this.byIdAfterSave(nadeId);

    this.clearRecentAndMapCache(nade);

    await remove(this.collection, nadeId);

    Logger.verbose(`NadeRepo.delete(${nadeId})`);
  };

  updateUserOnNades = async (steamId: string, user: UserLightModel) => {
    const nadeDocsByUser = await query(this.collection, [
      where("steamId", "==", steamId),
    ]);

    const { update, commit } = batch();

    nadeDocsByUser.forEach((doc) => {
      this.removeNadeFromCache({ id: doc.ref.id, slug: doc.data.slug });
      update(this.collection, doc.ref.id, {
        steamId: user.steamId,
        user: {
          nickname: user.nickname,
          steamId: user.steamId,
          avatar: user.avatar,
        },
      });
    });

    await commit();

    Logger.verbose(
      `NadeRepo.updateUserOnNades(${steamId}) -> ${nadeDocsByUser.length} | DB`
    );
  };

  incrementFavoriteCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      favoriteCount: value("increment", 1),
    });

    const nade = await this.byIdAfterSave(nadeId);
    this.removeNadeFromCache(nade);

    Logger.verbose(`NadeRepo.incrementFavoriteCount(${nadeId})`);

    return nade;
  };

  decrementFavoriteCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      favoriteCount: value("increment", -1),
    });

    const nade = await this.byIdAfterSave(nadeId);
    this.removeNadeFromCache(nade);

    Logger.verbose(`NadeRepo.decrementFavoriteCount(${nadeId})`);

    return nade;
  };

  incrementCommentCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      commentCount: value("increment", 1),
    });

    const nade = await this.byIdAfterSave(nadeId);

    this.removeNadeFromCache(nade);

    Logger.verbose(`NadeRepo.incrementCommentCount(${nadeId})`);

    return nade;
  };

  decrementCommentCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      commentCount: value("increment", -1),
    });

    const nade = await this.byIdAfterSave(nadeId);

    this.removeNadeFromCache(nade);

    Logger.verbose(`NadeRepo.decrementCommentCount(${nadeId})`);

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
    const nadeData = doc.data;
    const isNew = isNewNade(
      nadeData.createdAt,
      nadeData.gameMode === "csgo" ? 7 : 4
    );
    const score = calculateScore({
      commentCount: nadeData.commentCount,
      eloScore: nadeData.eloScore || 1450,
      favoriteCount: nadeData.favoriteCount,
      isPro: nadeData.isPro,
    });

    return {
      ...nadeData,
      id: doc.ref.id,
      score,
      favoriteCount: nadeData.favoriteCount || 0,
      eloScore: nadeData.eloScore || 1400,
      gameMode: nadeData.gameMode || "csgo",
      commentCount: nadeData.commentCount,
      mapEndLocationId: nadeData.mapEndLocationId,
      mapStartLocationId: nadeData.mapStartLocationId,
      isNew,
      images: {
        lineup: {
          small: nadeData.imageLineupThumb?.url || "",
          medium:
            nadeData.imageLineupThumb?.url || nadeData.imageLineup?.url || "",
          large:
            nadeData.imageLineup?.url || nadeData.imageLineupThumb?.url || "",
        },
        result: {
          small: nadeData.imageMainThumb?.url || nadeData.imageMain.url || "",
          medium: nadeData.imageMain.url || nadeData.imageMainThumb?.url || "",
          large: nadeData.imageMain.url || nadeData.imageMainThumb?.url || "",
        },
      },
    };
  };

  private tryGetNadeFromCache = (partialNade: {
    id?: string;
    slug?: string;
  }) => {
    const cacheKeySlug = `nade/${partialNade.slug}`;
    const cacheKeyId = `nade/${partialNade.id}`;
    if (partialNade.slug) {
      return this.cache.get<NadeDto>(cacheKeySlug);
    } else if (partialNade.id) {
      return this.cache.get<NadeDto>(cacheKeyId);
    }
  };

  private setNadeInCache = (nade?: NadeDto | null) => {
    if (!nade) {
      return;
    }

    const cacheKeySlug = `nade/${nade.slug}`;
    const cacheKeyId = `nade/${nade.id}`;

    if (nade.slug) {
      this.cache.set(cacheKeySlug, nade);
    }
    this.cache.set(cacheKeyId, nade);
  };

  private removeNadeFromCache = (opts: { id: string; slug?: string }) => {
    const cacheKeySlug = `nade/${opts.slug}`;
    const cacheKeyId = `nade/${opts.id}`;

    this.cache.del(cacheKeyId);
    if (opts.slug) {
      this.cache.del(cacheKeySlug);
    }
  };

  private createMapCacheKey = (
    csgoMap: CsMap,
    nadeType?: NadeType,
    gameMode?: GameMode
  ) => {
    const cacheKey = ["map", csgoMap, nadeType || "", gameMode || "csgo"].join(
      "/"
    );
    return cacheKey;
  };

  private recentCacheKey = (gameMode?: GameMode) => {
    return ["getRecent", gameMode].join("");
  };

  private clearRecentAndMapCache(
    nade: NadeDto,
    config?: { invalidateRecent: boolean }
  ) {
    if (config?.invalidateRecent) {
      const recentCacheKey = ["getRecent", nade?.gameMode || "csgo"].join("");
      this.mapNadeCache.del(recentCacheKey);
    }

    const mapCacheKey = this.createMapCacheKey(
      nade.map,
      nade.type,
      nade.gameMode
    );
    this.mapNadeCache.del(mapCacheKey);
  }
}
