import moment from "moment";
import { FavoriteDTO } from "../favorite/Favorite";
import { CachingService } from "../services/CachingService";
import { EventBus } from "../services/EventHandler";
import { GfycatService } from "../services/GfycatService";
import { IImageStorageService } from "../services/ImageStorageService";
import { UserLightModel, UserModel } from "../user/UserModel";
import { UserService } from "../user/UserService";
import { clamp } from "../utils/Common";
import { ErrorFactory } from "../utils/ErrorUtil";
import {
  CsgoMap,
  GfycatData,
  makeNadeFromBody,
  NadeCreateDTO,
  NadeDTO,
  NadeLightDTO,
  NadeModel,
  NadeStatusDTO,
  NadeUpdateDTO,
  updatedNadeMerge
} from "./Nade";
import { NadeRepo } from "./NadeRepo";

type NadeServiceDeps = {
  nadeRepo: NadeRepo;
  userService: UserService;
  imageStorageService: IImageStorageService;
  gfycatService: GfycatService;
  cache: CachingService;
  eventBus: EventBus;
};

export class NadeService {
  private nadeRepo: NadeRepo;
  private userService: UserService;
  private imageStorageService: IImageStorageService;
  private gfycatService: GfycatService;
  private cache: CachingService;
  private eventBus: EventBus;

  constructor(deps: NadeServiceDeps) {
    const {
      cache,
      gfycatService,
      imageStorageService,
      nadeRepo,
      userService,
      eventBus
    } = deps;

    this.nadeRepo = nadeRepo;
    this.userService = userService;
    this.imageStorageService = imageStorageService;
    this.gfycatService = gfycatService;
    this.cache = cache;
    this.eventBus = eventBus;

    this.eventBus.subNewFavorites(this.incrementFavoriteCount);
    this.eventBus.subUnFavorite(this.decrementFavoriteCount);
  }

  fetchNades = async (limit?: number): Promise<NadeLightDTO[]> => {
    const cachedNades = this.cache.getRecentNades();

    if (cachedNades) {
      return cachedNades.map(this.toLightDTO);
    }

    const nades = await this.nadeRepo.getAll(limit);

    this.cache.setRecentNades(nades);

    return nades.map(this.toLightDTO);
  };

  pending = async (): Promise<NadeLightDTO[]> => {
    const pendingDTOS = await this.nadeRepo.pending();
    const pending = pendingDTOS.map(this.toLightDTO);
    return pending;
  };

  byId = async (nadeId: string): Promise<NadeDTO> => {
    const cachedNade = this.cache.getNade(nadeId);

    if (cachedNade && !this.shouldUpdateStats(cachedNade)) {
      return cachedNade;
    }

    let nade = await this.nadeRepo.byId(nadeId);
    nade = await this.tryUpdateViewCounter(nade);

    this.cache.setNade(nadeId, nade);

    return nade;
  };

  list = async (ids: string[]): Promise<NadeLightDTO[]> => {
    const nades = await this.nadeRepo.list(ids);
    return nades.map(this.toLightDTO);
  };

  byMap = async (map: CsgoMap): Promise<NadeLightDTO[]> => {
    const cachedNades = this.cache.getByMap(map);

    if (cachedNades) {
      return cachedNades.map(this.toLightDTO);
    }

    const nades = await this.nadeRepo.byMap(map);

    this.cache.setByMap(map, nades);

    return nades.map(this.toLightDTO);
  };

  byUser = async (steamId: string): Promise<NadeLightDTO[]> => {
    const nadesByUse = await this.nadeRepo.byUser(steamId);
    return nadesByUse.map(this.toLightDTO);
  };

  save = async (
    body: NadeCreateDTO,
    steamID: string
  ): Promise<NadeDTO | null> => {
    const user = await this.userService.byId(steamID);

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

    this.eventBus.emitNewNade(nade);

    return nade;
  };

  delete = async (nadeId: string) => {
    const nade = await this.nadeRepo.byId(nadeId);

    await Promise.all([
      this.nadeRepo.delete(nade.id),
      this.imageStorageService.deleteImage(nade.images.largeId),
      this.imageStorageService.deleteImage(nade.images.thumbnailId)
    ]);

    this.eventBus.emitNadeDelete(nade);
    this.cache.invalidateNade(nadeId);
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
      this.cache.invalidateNade(updatedNade.id);
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
      throw ErrorFactory.NotFound("Nade not found.");
    }

    // Keep pending counter in sync on status change
    if (oldNade.status === "pending" && nade.status === "accepted") {
      this.eventBus.emitNadeAccepted(nade);
    }

    // Send notification if nade status changed to declined
    if (oldNade.status !== "declined" && nade.status === "declined") {
      this.eventBus.emitNadeDeclined(nade);
    }

    this.cache.invalidateRecent();
    this.cache.invalidateMap(nade.map);
    this.cache.invalidateNade(nadeId);

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

  private incrementFavoriteCount = async (favorite: FavoriteDTO) => {
    await this.nadeRepo.incrementFavoriteCount(favorite.nadeId);
    this.cache.invalidateNade(favorite.nadeId);
  };

  private decrementFavoriteCount = async (favorite: FavoriteDTO) => {
    await this.nadeRepo.decrementFavoriteCount(favorite.nadeId);
    this.cache.invalidateNade(favorite.nadeId);
  };

  private shouldUpdateStats(nade: NadeDTO) {
    if (!nade.lastGfycatUpdate) {
      return true;
    }

    const daysAgoSubmitted = moment().diff(
      moment(nade.createdAt),
      "days",
      false
    );

    const MIN_HOURS_TO_UPDATE = 1;
    const MAX_HOURS_TO_UPDATE = 48;

    const hoursToWaitForUpdate = clamp(
      daysAgoSubmitted,
      MIN_HOURS_TO_UPDATE,
      MAX_HOURS_TO_UPDATE
    );

    const lastUpdated = nade.lastGfycatUpdate;
    const hoursSinceUpdate = moment().diff(moment(lastUpdated), "hours", false);

    const shouldUpdate = hoursSinceUpdate > hoursToWaitForUpdate;

    return shouldUpdate;
  }

  isAllowedEdit = async (nadeId: string, steamId: string): Promise<boolean> => {
    try {
      const nade = await this.byId(nadeId);
      const user = await this.userService.byId(steamId);

      if (!nade) {
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
    } catch (error) {
      return false;
    }
  };

  private tryUpdateViewCounter = async (nade: NadeDTO): Promise<NadeDTO> => {
    const shouldUpdate = this.shouldUpdateStats(nade);
    if (!shouldUpdate) {
      return nade;
    }

    const gfycat = await this.gfycatService.getGfycatData(nade.gfycat.gfyId);

    if (!gfycat) {
      // Gfycat service down, so we can't update view counter
      return nade;
    }

    const updatedNadeViews: Partial<NadeModel> = {
      viewCount: gfycat.gfyItem.views
    };

    const viewCountDidDiffer = gfycat.gfyItem.views !== nade.viewCount;

    const updatedNade = await this.nadeRepo.update(nade.id, updatedNadeViews);

    if (viewCountDidDiffer) {
      this.cache.invalidateNade(updatedNade.id);
    }

    return updatedNade;
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
      type: nadeDto.type,
      mapEndCoord: nadeDto.mapEndCoord,
      score: nadeDto.score
    };
  };
}
