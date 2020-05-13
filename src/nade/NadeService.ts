import moment from "moment";
import { FavoriteDTO } from "../favorite/Favorite";
import { ImageGalleryService } from "../imageGallery/ImageGalleryService";
import { NadeCommentDto } from "../nadecomment/NadeComment";
import { CachingService } from "../services/CachingService";
import { EventBus } from "../services/EventHandler";
import { GfycatService } from "../services/GfycatService";
import { UserDTO } from "../user/UserDTOs";
import { UserLightModel } from "../user/UserModel";
import { UserService } from "../user/UserService";
import { clamp, removeUndefines } from "../utils/Common";
import { ErrorFactory } from "../utils/ErrorUtil";
import {
  CsgoMap,
  NadeCreateDTO,
  NadeCreateModel,
  NadeDTO,
  NadeImages,
  NadeLightDTO,
  NadeModel,
  NadeUpdateDTO,
  updatedNadeMerge,
} from "./Nade";
import { NadeRepo } from "./NadeRepo";

type NadeServiceDeps = {
  nadeRepo: NadeRepo;
  userService: UserService;
  galleryService: ImageGalleryService;
  gfycatService: GfycatService;
  cache: CachingService;
  eventBus: EventBus;
};

export class NadeService {
  private nadeRepo: NadeRepo;
  private userService: UserService;
  private galleryService: ImageGalleryService;
  private gfycatService: GfycatService;
  private cache: CachingService;
  private eventBus: EventBus;

  constructor(deps: NadeServiceDeps) {
    const {
      cache,
      gfycatService,
      galleryService,
      nadeRepo,
      userService,
      eventBus,
    } = deps;

    this.nadeRepo = nadeRepo;
    this.userService = userService;
    this.galleryService = galleryService;
    this.gfycatService = gfycatService;
    this.cache = cache;
    this.eventBus = eventBus;

    this.eventBus.subNewFavorites(this.incrementFavoriteCount);
    this.eventBus.subUnFavorite(this.decrementFavoriteCount);
    this.eventBus.subNadeCommentCreate(this.incrementCommentCount);
    this.eventBus.subNadeCommentDelete(this.decrementCommentCount);
    this.eventBus.subUserDetailsUpdate(this.onUserDetailsUpdated);
  }

  slugIsFree = (slug: string) => this.nadeRepo.slugIsFree(slug);

  onUserDetailsUpdated = async (user: UserDTO) => {
    await this.nadeRepo.updateUserOnNades(user.steamId, {
      avatar: user.avatar,
      nickname: user.nickname,
      steamId: user.steamId,
    });

    // Clear cache on update
    this.cache.flushAll();
  };

  fetchNades = async (
    limit?: number,
    noCache?: boolean
  ): Promise<NadeLightDTO[]> => {
    const cachedNades = this.cache.getRecentNades();

    if (cachedNades && !noCache) {
      return cachedNades.map(this.toLightDTO);
    }

    const nades = await this.nadeRepo.getAll(limit);

    if (!noCache) {
      this.cache.setRecentNades(nades);
    }

    return nades.map(this.toLightDTO);
  };

  pending = async (): Promise<NadeLightDTO[]> => {
    const pendingDTOS = await this.nadeRepo.pending();
    const pending = pendingDTOS.map(this.toLightDTO);
    return pending;
  };

  declined = async (): Promise<NadeLightDTO[]> => {
    const declinedDTOS = await this.nadeRepo.declined();
    const pending = declinedDTOS.map(this.toLightDTO);
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

  bySlug = async (slug: string): Promise<NadeDTO> => {
    const cachedNade = this.cache.getNade(slug);

    if (cachedNade && !this.shouldUpdateStats(cachedNade)) {
      return cachedNade;
    }

    let nade = await this.nadeRepo.bySlug(slug);
    nade = await this.tryUpdateViewCounter(nade);

    this.cache.setNade(slug, nade);

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
    const cachedNades = this.cache.getUserNades(steamId);

    if (cachedNades) {
      return cachedNades;
    }

    const nadesByUse = await this.nadeRepo.byUser(steamId);

    const nadesDto = nadesByUse.map(this.toLightDTO);

    this.cache.setUserNades(steamId, nadesDto);

    return nadesDto;
  };

  save = async (
    body: NadeCreateDTO,
    steamID: string
  ): Promise<NadeDTO | null> => {
    const imageBuilder: NadeImages = {
      thumbnailId: "",
      thumbnailUrl: "",
    };

    const user = await this.userService.byId(steamID);

    const userLight: UserLightModel = {
      nickname: user.nickname,
      avatar: user.avatar,
      steamId: user.steamId,
    };

    const gfycatData = await this.gfycatService.getGfycatData(
      body.gfycat.gfyId
    );

    if (!gfycatData) {
      throw ErrorFactory.ExternalError(
        "Gfycat seems to be down. Try again later."
      );
    }

    const resultImage = await this.galleryService.createThumbnail(
      body.imageBase64,
      "nades"
    );

    imageBuilder.thumbnailId = `${resultImage.collection}/${resultImage.id}`;
    imageBuilder.thumbnailUrl = resultImage.url;

    if (body.lineUpImageBase64) {
      const lineupImage = await this.galleryService.createThumbnail(
        body.lineUpImageBase64,
        "lineup"
      );
      imageBuilder.lineupId = `${lineupImage.collection}/${lineupImage.id}`;
      imageBuilder.lineupUrl = lineupImage.url;
    }

    const nadeModel: NadeCreateModel = {
      commentCount: 0,
      favoriteCount: 0,
      gfycat: body.gfycat,
      images: removeUndefines(imageBuilder),
      steamId: userLight.steamId,
      user: userLight,
      viewCount: gfycatData.gfyItem.views,
      description: body.description,
      endPosition: body.endPosition,
      startPosition: body.startPosition,
      map: body.map,
      mapEndCoord: body.mapEndCoord,
      movement: body.movement,
      technique: body.technique,
      tickrate: body.tickrate,
      type: body.type,
    };

    const nade = await this.nadeRepo.save(nadeModel);

    this.eventBus.emitNewNade(nade);
    this.cache.invalidateUserNades(nade.steamId);

    return nade;
  };

  delete = async (nadeId: string) => {
    const nade = await this.nadeRepo.byId(nadeId);

    await this.galleryService.deleteImage(nade.images.thumbnailId);

    if (nade.images.lineupId) {
      await this.galleryService.deleteImage(nade.images.lineupId);
    }

    await this.nadeRepo.delete(nade.id);

    this.eventBus.emitNadeDelete(nade);
    this.cache.invalidateNade(nadeId);
    this.cache.invalidateUserNades(nade.steamId);
  };

  update = async (
    nadeId: string,
    updateFields: NadeUpdateDTO
  ): Promise<NadeDTO | null> => {
    const originalNade = await this.byId(nadeId);

    let newImageData: NadeImages | undefined;

    // Update result image
    if (updateFields.imageBase64) {
      // Delete old image
      await this.galleryService.deleteImage(originalNade.images.thumbnailId);

      // Add new image
      const imageData = await this.galleryService.createThumbnail(
        updateFields.imageBase64,
        "nades"
      );

      newImageData = {
        ...originalNade.images,
        thumbnailId: `${imageData.collection}/${imageData.id}`,
        thumbnailUrl: imageData.url,
      };
    }

    // Update lineup image
    if (updateFields.lineUpImageBase64) {
      // Delete old if present
      if (originalNade.images.lineupId) {
        await this.galleryService.deleteImage(originalNade.images.lineupId);
      }

      const newLineUpImage = await this.galleryService.createLarge(
        updateFields.lineUpImageBase64,
        "lineup"
      );

      // If original image was updated aswell
      if (newImageData) {
        newImageData = {
          ...newImageData,
          ...originalNade.images,
          lineupId: `${newLineUpImage.collection}/${newLineUpImage.id}`,
          lineupUrl: newLineUpImage.url,
        };
      } else {
        newImageData = {
          ...originalNade.images,
          lineupId: `${newLineUpImage.collection}/${newLineUpImage.id}`,
          lineupUrl: newLineUpImage.url,
        };
      }
    }

    const mergedNade = updatedNadeMerge(updateFields, newImageData);

    const updatedNade = await this.nadeRepo.update(nadeId, mergedNade, true);

    this.handleStatusChange(originalNade, updatedNade);

    this.cache.invalidateNade(updatedNade.id);
    this.cache.invalidateMap(updatedNade.map);
    this.cache.invalidateUserNades(updatedNade.steamId);

    return updatedNade;
  };

  private handleStatusChange = (prevNade: NadeDTO, newNade: NadeDTO) => {
    const prevStatus = prevNade.status;
    const newStatus = newNade.status;

    if (newStatus === "accepted" && prevStatus !== "accepted") {
      this.eventBus.emitNadeAccepted(newNade);
    }
    if (newStatus === "declined" && prevStatus !== "declined") {
      this.eventBus.emitNadeDeclined(newNade);
    }
  };

  private incrementFavoriteCount = async (favorite: FavoriteDTO) => {
    const nade = await this.nadeRepo.incrementFavoriteCount(favorite.nadeId);
    this.cache.invalidateNade(nade.id);
    this.cache.invalidateUserNades(nade.steamId);
  };

  private decrementFavoriteCount = async (favorite: FavoriteDTO) => {
    const nade = await this.nadeRepo.decrementFavoriteCount(favorite.nadeId);
    this.cache.invalidateNade(nade.id);
    this.cache.invalidateUserNades(nade.steamId);
  };

  private incrementCommentCount = async (comment: NadeCommentDto) => {
    const nade = await this.nadeRepo.incrementCommentCount(comment.nadeId);
    this.cache.invalidateNade(nade.id);
    this.cache.invalidateUserNades(nade.steamId);
  };

  private decrementCommentCount = async (comment: NadeCommentDto) => {
    const nade = await this.nadeRepo.decrementCommentCount(comment.nadeId);
    this.cache.invalidateNade(nade.id);
    this.cache.invalidateUserNades(nade.steamId);
  };

  private shouldUpdateStats = (nade: NadeDTO) => {
    if (!nade.lastGfycatUpdate) {
      return true;
    }

    const daysAgoSubmitted = moment().diff(
      moment(nade.createdAt),
      "days",
      false
    );

    const MIN_HOURS_TO_UPDATE = 6;
    const MAX_HOURS_TO_UPDATE = 72;

    const hoursToWaitForUpdate = clamp(
      daysAgoSubmitted,
      MIN_HOURS_TO_UPDATE,
      MAX_HOURS_TO_UPDATE
    );

    const lastUpdated = nade.lastGfycatUpdate;
    const hoursSinceUpdate = moment().diff(moment(lastUpdated), "hours", false);

    const shouldUpdate = hoursSinceUpdate >= hoursToWaitForUpdate;

    return shouldUpdate;
  };

  private timeToNextUpdate = (nade: NadeDTO): number => {
    if (!nade.lastGfycatUpdate) {
      return 24;
    }

    const daysAgoSubmitted = moment().diff(
      moment(nade.createdAt),
      "days",
      false
    );

    const MIN_HOURS_TO_UPDATE = 6;
    const MAX_HOURS_TO_UPDATE = 72;

    const hoursToWaitForUpdate = clamp(
      daysAgoSubmitted,
      MIN_HOURS_TO_UPDATE,
      MAX_HOURS_TO_UPDATE
    );

    const lastUpdated = nade.lastGfycatUpdate;
    const hoursSinceUpdate = moment().diff(moment(lastUpdated), "hours", false);

    const nextUpdate = hoursToWaitForUpdate - hoursSinceUpdate;

    if (nextUpdate < 0) {
      return 0;
    }

    return nextUpdate;
  };

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
      viewCount: gfycat.gfyItem.views,
      gfycat: {
        gfyId: gfycat.gfyItem.gfyId,
        smallVideoUrl: gfycat.gfyItem.mobileUrl,
        largeVideoUrl: gfycat.gfyItem.mp4Url,
        largeVideoWebm: gfycat.gfyItem.webmUrl,
        avgColor: gfycat.gfyItem.avgColor,
        duration: videoDuration(
          gfycat.gfyItem.frameRate,
          gfycat.gfyItem.numFrames
        ),
      },
      lastGfycatUpdate: new Date(),
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
      slug: nadeDto.slug,
      createdAt: nadeDto.createdAt,
      favoriteCount: nadeDto.favoriteCount,
      gfycat: nadeDto.gfycat,
      images: nadeDto.images,
      status: nadeDto.status,
      viewCount: nadeDto.viewCount,
      mapSite: nadeDto.mapSite,
      tickrate: nadeDto.tickrate,
      title: nadeDto.title,
      endPosition: nadeDto.endPosition,
      startPosition: nadeDto.startPosition,
      type: nadeDto.type,
      mapEndCoord: nadeDto.mapEndCoord,
      score: nadeDto.score,
      movement: nadeDto.movement,
      technique: nadeDto.technique,
      updatedAt: nadeDto.updatedAt,
      commentCount: nadeDto.commentCount,
      user: nadeDto.user,
      nextUpdateInHours: this.timeToNextUpdate(nadeDto),
      oneWay: nadeDto.oneWay,
      isPro: nadeDto.isPro,
    };
  };
}

function videoDuration(framerate?: number, numFrames?: number) {
  if (!framerate || !numFrames) {
    return undefined;
  }
  const seconds = Math.floor(numFrames / framerate);
  return `PT0M${seconds}S`;
}
