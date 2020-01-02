import { NadeRepo } from "./NadeRepo";
import { err, ok } from "neverthrow";
import {
  NadeCreateDTO,
  makeNadeFromBody,
  CsgoMap,
  NadeUpdateDTO,
  updatedNadeMerge,
  GfycatData,
  NadeStats,
  NadeModel,
  NadeStatusDTO
} from "./Nade";
import { IImageStorageService } from "../services/ImageStorageService";
import { GfycatService } from "../services/GfycatService";
import { IUserService } from "../user/UserService";
import { UserModel, UserLightModel } from "../user/UserModel";
import { AppResult } from "../utils/Common";
import { makeError } from "../utils/ErrorUtil";
import { StatsService } from "../stats/StatsService";
import { NadeFilter } from "./NadeFilter";
import NodeCache = require("node-cache");
import { CachingService } from "../services/CachingService";

export interface INadeService {
  fetchNades(limit?: number): AppResult<NadeModel[]>;

  fetchByID(nadeId: string): AppResult<NadeModel>;

  fetchByIdList(ids: string[]): AppResult<NadeModel[]>;

  fetchByMap(map: CsgoMap, nadeFilter: NadeFilter): AppResult<NadeModel[]>;

  fetchByUser(steamId: string): AppResult<NadeModel[]>;

  saveFromBody(body: NadeCreateDTO, steamID: string): AppResult<NadeModel>;

  isAllowedEdit(nadeId: string, steamId: string): Promise<boolean>;

  update(nadeId: string, updateFields: NadeUpdateDTO): AppResult<NadeModel>;

  forceUserUpdate(nadeId: string, newSteamId: string): AppResult<NadeModel>;

  updateNadeStatus(
    nadeId: string,
    updatedStatus: NadeStatusDTO
  ): AppResult<NadeModel>;

  delete(nadeId: string): Promise<boolean>;

  updateNadesWithUser(
    steamId: string,
    user: UserLightModel
  ): AppResult<boolean>;

  updateStats(nadeId: string, stats: Partial<NadeStats>);
}

export class NadeService implements INadeService {
  private nadeRepo: NadeRepo;
  private userService: IUserService;
  private imageStorageService: IImageStorageService;
  private gfycatService: GfycatService;
  private statsService: StatsService;
  private cache: CachingService;

  constructor(
    nadeRepo: NadeRepo,
    userService: IUserService,
    imageStorageService: IImageStorageService,
    gfycatService: GfycatService,
    statsService: StatsService,
    cache: CachingService
  ) {
    this.nadeRepo = nadeRepo;
    this.userService = userService;
    this.imageStorageService = imageStorageService;
    this.gfycatService = gfycatService;
    this.statsService = statsService;
    this.cache = cache;
  }

  async fetchNades(limit: number = 8): AppResult<NadeModel[]> {
    const cacheKey = `fetchNades-${limit}`;
    const cachedNades = this.cache.get<NadeModel[]>(cacheKey);

    if (cachedNades) {
      return ok(cachedNades);
    }

    const nades = await this.nadeRepo.get(limit);

    if (nades.isOk()) {
      this.cache.set(cacheKey, nades.value);
    }

    return nades;
  }

  async fetchByID(nadeId: string): AppResult<NadeModel> {
    const cacheKey = `nade-${nadeId}`;
    const cachedNade = this.cache.get<NadeModel>(cacheKey);

    if (cachedNade) {
      return ok(cachedNade);
    }

    const nadeResult = await this.nadeRepo.byID(nadeId);

    if (nadeResult.isErr()) {
      return nadeResult;
    }

    const nadeModel = nadeResult.value;

    if (this.shouldUpdateStats(nadeModel)) {
      const gfycatResult = await this.gfycatService.getGfycatData(
        nadeModel.gfycat.gfyId
      );

      if (gfycatResult.isErr()) {
        return nadeResult;
      }

      const gfyData = gfycatResult.value;

      const nadeStats: Partial<NadeStats> = {
        views: gfyData.gfyItem.views
      };

      const updatedNadeResult = await this.nadeRepo.updateStats(
        nadeId,
        nadeStats
      );

      if (updatedNadeResult.isOk()) {
        this.cache.set(cacheKey, updatedNadeResult.value);
      }

      return updatedNadeResult;
    } else {
      if (nadeResult.isOk()) {
        this.cache.set(cacheKey, nadeResult.value);
      }
      return nadeResult;
    }
  }

  fetchByIdList(ids: string[]): AppResult<NadeModel[]> {
    return this.nadeRepo.listByIds(ids);
  }

  async fetchByMap(
    map: CsgoMap,
    nadeFilter: NadeFilter
  ): AppResult<NadeModel[]> {
    const cacheKey = `map-${map}-${JSON.stringify(nadeFilter)}`;
    const cachedNades = this.cache.get<NadeModel[]>(cacheKey);

    if (cachedNades) {
      return ok(cachedNades);
    }

    const result = await this.nadeRepo.byMap(map, nadeFilter);

    if (result.isOk()) {
      this.cache.set(cacheKey, result.value);
    }

    return result;
  }

  fetchByUser(steamId: string): AppResult<NadeModel[]> {
    return this.nadeRepo.byUser(steamId);
  }

  async saveFromBody(
    body: NadeCreateDTO,
    steamID: string
  ): AppResult<NadeModel> {
    const userResult = await this.userService.bySteamID(steamID);

    if (userResult.isErr()) {
      return makeError(userResult.error.status, userResult.error.message);
    }

    const user = userResult.value;

    const userLight: UserLightModel = {
      nickname: user.nickname,
      avatar: user.avatar,
      steamId: user.steamId
    };

    const gfycatDataResult = await this.gfycatService.getGfycatData(
      body.gfycatIdOrUrl
    );

    if (gfycatDataResult.isErr()) {
      return makeError(
        gfycatDataResult.error.status,
        gfycatDataResult.error.message
      );
    }

    const gfycatData = gfycatDataResult.value;

    const nadeImagesResult = await this.imageStorageService.saveImage(
      body.imageBase64
    );

    if (nadeImagesResult.isErr()) {
      return makeError(
        nadeImagesResult.error.status,
        nadeImagesResult.error.message
      );
    }

    const nadeImages = nadeImagesResult.value;

    const tmpNade = makeNadeFromBody(userLight, gfycatData, nadeImages);
    const nade = await this.nadeRepo.save(tmpNade);

    await this.statsService.incrementNadeCounter();

    // Clear cache on new nade
    this.cache.flushAll();

    return nade;
  }

  async delete(nadeId: string): Promise<boolean> {
    const nadeResult = await this.nadeRepo.byID(nadeId);

    if (nadeResult.isErr()) {
      return false;
    }

    const nade = nadeResult.value;

    const [
      firestoreDeleteResult,
      deleteLargeOk,
      deleteThumbOk
    ] = await Promise.all([
      this.nadeRepo.delete(nade.id),
      this.imageStorageService.deleteImage(nade.images.largeId),
      this.imageStorageService.deleteImage(nade.images.thumbnailId)
    ]);

    if (!deleteLargeOk || !deleteThumbOk || firestoreDeleteResult.isErr()) {
      return false;
    }

    await this.statsService.decrementNadeCounter();

    // Clear cache on nade delete
    this.cache.flushAll();

    return true;
  }

  async isAllowedEdit(nadeId: string, steamId: string): Promise<boolean> {
    const nadeResult = await this.fetchByID(nadeId);
    const userResult = await this.userService.bySteamID(steamId);

    if (userResult.isErr() || nadeResult.isErr()) {
      return false;
    }

    const nade = nadeResult.value;
    const user = userResult.value;

    if (user.role === "administrator" || user.role === "moderator") {
      return true;
    }

    if (nade.steamId === user.steamId) {
      return true;
    }

    return false;
  }

  async update(
    nadeId: string,
    updateFields: NadeUpdateDTO
  ): AppResult<NadeModel> {
    const nadeResult = await this.nadeRepo.byID(nadeId);

    if (nadeResult.isErr()) {
      return nadeResult;
    }

    const oldNade = nadeResult.value;

    let newGfyData: GfycatData;
    let newUser: UserModel;
    let newStats: NadeStats;

    if (updateFields.gfycatIdOrUrl) {
      const gfycatResult = await this.gfycatService.getGfycatData(
        updateFields.gfycatIdOrUrl
      );

      if (gfycatResult.isErr()) {
        return err(gfycatResult.error);
      }

      const gfycatDate = gfycatResult.value;

      newGfyData = {
        gfyId: gfycatDate.gfyItem.gfyId,
        smallVideoUrl: gfycatDate.gfyItem.mobileUrl,
        largeVideoUrl: gfycatDate.gfyItem.mp4Url
      };
      newStats = {
        ...oldNade.stats,
        views: gfycatDate.gfyItem.views
      };
    }

    const mergedNade = updatedNadeMerge(
      updateFields,
      oldNade,
      newUser,
      newGfyData,
      newStats
    );

    const updatedNade = await this.nadeRepo.update(mergedNade.id, mergedNade);

    // Clear cache on update
    this.cache.flushAll();

    return updatedNade;
  }

  async forceUserUpdate(
    nadeId: string,
    newSteamId: string
  ): AppResult<NadeModel> {
    const userResult = await this.userService.getOrCreateUser(newSteamId);

    if (userResult.isErr()) {
      return makeError(userResult.error.status, userResult.error.message);
    }

    const user = userResult.value;

    const updateResult = await this.nadeRepo.update(nadeId, {
      steamId: newSteamId,
      user: {
        nickname: user.nickname,
        steamId: user.steamId,
        avatar: user.avatar
      }
    });

    // Clear cache on update
    this.cache.flushAll();

    return updateResult;
  }

  updateNadeStatus(
    nadeId: string,
    updatedStatus: NadeStatusDTO
  ): AppResult<NadeModel> {
    // Clear cache on update
    this.cache.flushAll();

    return this.nadeRepo.update(nadeId, updatedStatus);
  }

  updateNadesWithUser(
    steamId: string,
    user: UserLightModel
  ): AppResult<boolean> {
    // Clear cache on update
    this.cache.flushAll();

    return this.nadeRepo.updateUserOnNades(steamId, user);
  }

  async updateStats(nadeId: string, stats: Partial<NadeStats>) {
    await this.nadeRepo.updateStats(nadeId, stats);
  }

  private shouldUpdateStats(nade: NadeModel) {
    if (!nade.lastGfycatUpdate) {
      return true;
    }

    const lastUpdated = nade.lastGfycatUpdate.toMillis();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const isMoreThanADayAgo = now - lastUpdated > oneDay;

    return isMoreThanADayAgo;
  }
}
