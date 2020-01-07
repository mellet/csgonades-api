import {
  NadeCreateDTO,
  makeNadeFromBody,
  CsgoMap,
  NadeUpdateDTO,
  updatedNadeMerge,
  GfycatData,
  NadeStatusDTO,
  NadeDTO,
  NadeLightDTO,
  NadeModel
} from "./Nade";
import { IImageStorageService } from "../services/ImageStorageService";
import { GfycatService } from "../services/GfycatService";
import { UserModel, UserLightModel } from "../user/UserModel";
import { StatsService } from "../stats/StatsService";
import { NadeFilter } from "./NadeFilter";
import { CachingService } from "../services/CachingService";
import { UserService } from "../user/UserService";
import { NadeRepo } from "./NadeRepo";
import moment from "moment";

export class NadeService {
  private nadeRepo: NadeRepo;
  private userService: UserService;
  private imageStorageService: IImageStorageService;
  private gfycatService: GfycatService;
  private statsService: StatsService;
  private cache: CachingService;

  constructor(
    nadeRepo: NadeRepo,
    userService: UserService,
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

  fetchNades = async (limit?: number): Promise<NadeLightDTO[]> => {
    const cacheKey = limit ? `fetchNades-${limit}` : `fetchNades-all`;

    const cachedNades = this.cache.getAllNades(cacheKey);

    if (cachedNades) {
      return cachedNades.map(this.toLightDTO);
    }

    const nades = await this.nadeRepo.getAll(limit);

    return nades.map(this.toLightDTO);
  };

  pending = async (): Promise<NadeLightDTO[]> => {
    const pendingDTOS = await this.nadeRepo.pending();
    const pending = pendingDTOS.map(this.toLightDTO);
    return pending;
  };

  byId = async (nadeId: string) => {
    const cachedNade = this.cache.getNade(nadeId);

    if (cachedNade) {
      return cachedNade;
    }

    const nade = await this.nadeRepo.byId(nadeId);

    if (nade) {
      this.cache.setNade(nadeId, nade);
    }

    if (nade && this.shouldUpdateStats(nade)) {
      const gfycat = await this.gfycatService.getGfycatData(nade.gfycat.gfyId);

      if (!gfycat) {
        return nade;
      }

      const updatedNadeViews: Partial<NadeModel> = {
        viewCount: gfycat.gfyItem.views
      };

      const updatedNade = await this.nadeRepo.update(nadeId, updatedNadeViews);

      if (updatedNade) {
        this.cache.setNade(updatedNade.id, updatedNade);
        this.cache.delCacheWithMap(updatedNade.map);
      }

      return updatedNade;
    }

    return nade;
  };

  list = (ids: string[]): Promise<NadeLightDTO[]> => {
    return this.nadeRepo.list(ids);
  };

  byMap = async (
    map: CsgoMap,
    nadeFilter: NadeFilter
  ): Promise<NadeLightDTO[]> => {
    const cachedNades = this.cache.getByMap(map, nadeFilter);

    if (cachedNades) {
      return cachedNades;
    }

    const nades = await this.nadeRepo.byMap(map, nadeFilter);

    this.cache.setByMap(map, nades, nadeFilter);

    return nades;
  };

  byUser = (steamId: string): Promise<NadeLightDTO[]> => {
    return this.nadeRepo.byUser(steamId);
  };

  save = async (
    body: NadeCreateDTO,
    steamID: string
  ): Promise<NadeDTO | null> => {
    const user = await this.userService.byId(steamID);

    if (!user) {
      // TODO: Throw sensible error
      return null;
    }

    const userLight: UserLightModel = {
      nickname: user.nickname,
      avatar: user.avatar,
      steamId: user.steamId
    };

    const gfycatData = await this.gfycatService.getGfycatData(
      body.gfycatIdOrUrl
    );

    if (!gfycatData) {
      // TODO: Throw sensible error
      return null;
    }

    const nadeImages = await this.imageStorageService.saveImage(
      body.imageBase64
    );

    if (!nadeImages) {
      // TODO: Throw sensible error
      return null;
    }

    const tmpNade = makeNadeFromBody(userLight, gfycatData, nadeImages);
    const nade = await this.nadeRepo.save(tmpNade);

    await this.statsService.incrementNadeCounter();
    await this.statsService.incrementPendingCounter();

    return nade;
  };

  delete = async (nadeId: string) => {
    const nade = await this.nadeRepo.byId(nadeId);

    if (!nade) {
      // TODO: Throw sensible error
      return null;
    }

    await Promise.all([
      this.nadeRepo.delete(nade.id),
      this.imageStorageService.deleteImage(nade.images.largeId),
      this.imageStorageService.deleteImage(nade.images.thumbnailId)
    ]);

    await this.statsService.decrementNadeCounter();

    // Clear cache where map was the nades map
    this.cache.delNade(nadeId);
    this.cache.delCacheWithMap(nade.map);
  };

  async update(
    nadeId: string,
    updateFields: NadeUpdateDTO
  ): Promise<NadeDTO | null> {
    let newGfyData: GfycatData | undefined;
    let newUser: UserModel | undefined;
    let viewCount: number | undefined;

    if (updateFields.gfycatIdOrUrl) {
      const gfycatData = await this.gfycatService.getGfycatData(
        updateFields.gfycatIdOrUrl
      );

      if (!gfycatData) {
        // TODO: Throw sensible error
        return null;
      }

      newGfyData = {
        gfyId: gfycatData.gfyItem.gfyId,
        smallVideoUrl: gfycatData.gfyItem.mobileUrl,
        largeVideoUrl: gfycatData.gfyItem.mp4Url
      };

      viewCount = gfycatData.gfyItem.views;
    }

    const mergedNade = updatedNadeMerge(
      updateFields,
      viewCount,
      newUser,
      newGfyData
    );

    const updatedNade = await this.nadeRepo.update(nadeId, mergedNade);

    if (updatedNade) {
      this.cache.delNade(updatedNade.id);
    }

    return updatedNade;
  }

  async updateNadeStatus(
    nadeId: string,
    updatedStatus: NadeStatusDTO
  ): Promise<NadeDTO | null> {
    const oldNade = await this.nadeRepo.byId(nadeId);

    const nade = await this.nadeRepo.update(nadeId, updatedStatus);

    if (!nade || !oldNade) {
      // TODO: Throw sensible error
      return null;
    }

    // Keep pending counter in sync on status change
    if (oldNade.status === "pending" && nade.status !== "pending") {
      await this.statsService.decrementPendingCounter();
    }
    if (oldNade.status !== "pending" && nade.status === "pending") {
      await this.statsService.incrementPendingCounter();
    }

    this.cache.delNade(nade.id);

    return nade;
  }

  async updateNadesWithUser(
    steamId: string,
    user: UserLightModel
  ): Promise<void> {
    await this.nadeRepo.updateUserOnNades(steamId, user);

    // Clear cache on update
    this.cache.flushAll();

    return;
  }

  incrementFavoriteCount = async (nadeId: string) => {
    await this.nadeRepo.incrementFavoriteCount(nadeId);
  };

  decrementFavoriteCount = async (nadeId: string) => {
    await this.nadeRepo.decrementFavoriteCount(nadeId);
  };

  private shouldUpdateStats(nade: NadeDTO) {
    if (!nade.lastGfycatUpdate) {
      return true;
    }

    const lastUpdated = nade.lastGfycatUpdate;

    let hours = moment().diff(moment(lastUpdated), "hours", false);

    if (hours > 6) {
      return true;
    }

    return false;
  }

  isAllowedEdit = async (nadeId: string, steamId: string): Promise<boolean> => {
    const nade = await this.byId(nadeId);
    const user = await this.userService.byId(steamId);

    if (!user || !nade) {
      // TODO: Throw sensible error
      return false;
    }

    if (user.role === "administrator" || user.role === "moderator") {
      return true;
    }

    if (nade.steamId === user.steamId) {
      return true;
    }

    return false;
  };

  private toLightDTO = (nadeDto: NadeDTO): NadeLightDTO => {
    return {
      id: nadeDto.id,
      createdAt: nadeDto.createdAt,
      favoriteCount: nadeDto.favoriteCount,
      gfycat: nadeDto.gfycat,
      images: nadeDto.images,
      status: nadeDto.status,
      viewCount: nadeDto.viewCount,
      mapSite: nadeDto.mapSite,
      tickrate: nadeDto.tickrate,
      title: nadeDto.title,
      type: nadeDto.type
    };
  };
}
