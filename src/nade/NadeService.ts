import { GfycatApi } from "../external-api/GfycatApi";
import { FavoriteRepo } from "../favorite/FavoriteRepo";
import { ImageRepo } from "../imageGallery/ImageGalleryService";
import { ImageData } from "../imageGallery/ImageStorageRepo";
import { NadeCommentRepo } from "../nadecomment/NadeCommentRepo";
import { NotificationRepo } from "../notifications/NotificationRepo";
import { StatsRepo } from "../stats/StatsRepo";
import { UserLightModel } from "../user/UserModel";
import { UserRepo } from "../user/UserRepo";
import { RequestUser } from "../utils/AuthUtils";
import { removeUndefines } from "../utils/Common";
import { ErrorFactory } from "../utils/ErrorUtil";
import {
  NadeCreateDTO,
  NadeCreateModel,
  NadeDTO,
  NadeImages,
  NadeMiniDto,
  NadeModel,
  NadeUpdateDTO,
} from "./Nade";
import { NadeRepo } from "./NadeRepo";
import { CsgoMap } from "./nadeSubTypes/CsgoMap";
import { NadeStatus } from "./nadeSubTypes/NadeStatus";
import {
  convertNadesToLightDto,
  newStatsFromGfycat,
  shouldUpdateNadeStats,
  verifyAdminFields,
  verifyAllowEdit,
} from "./NadeUtils";

export type NadeServiceDeps = {
  nadeRepo: NadeRepo;
  commentRepo: NadeCommentRepo;
  statsRepo: StatsRepo;
  imageRepo: ImageRepo;
  gfycatApi: GfycatApi;
  notificationRepo: NotificationRepo;
  favoriteRepo: FavoriteRepo;
};

export class NadeService {
  private nadeRepo: NadeRepo;
  private userRepo: UserRepo;
  private imageRepo: ImageRepo;
  private gfycatApi: GfycatApi;
  private statsRepo: StatsRepo;
  private commentRepo: NadeCommentRepo;
  private notificationRepo: NotificationRepo;
  private favoriteRepo: FavoriteRepo;

  constructor(deps: NadeServiceDeps) {
    const {
      gfycatApi,
      imageRepo,
      nadeRepo,
      statsRepo,
      commentRepo,
      notificationRepo,
      favoriteRepo,
    } = deps;

    this.nadeRepo = nadeRepo;
    this.imageRepo = imageRepo;
    this.gfycatApi = gfycatApi;
    this.statsRepo = statsRepo;
    this.commentRepo = commentRepo;
    this.notificationRepo = notificationRepo;
    this.favoriteRepo = favoriteRepo;
  }

  isSlugAvailable = async (slug: string) => {
    return this.nadeRepo.isSlugAvailable(slug);
  };

  getRecent = async (limit?: number): Promise<NadeMiniDto[]> => {
    const nades = await this.nadeRepo.getAll(limit);

    return convertNadesToLightDto(nades);
  };

  getPending = async (): Promise<NadeMiniDto[]> => {
    const pendingNades = await this.nadeRepo.getPending();

    return convertNadesToLightDto(pendingNades);
  };

  getDeclined = async (): Promise<NadeMiniDto[]> => {
    const declinedNades = await this.nadeRepo.getDeclined();

    return convertNadesToLightDto(declinedNades);
  };

  getById = async (nadeId: string): Promise<NadeDTO> => {
    const nade = await this.nadeRepo.getById(nadeId);
    await this.tryUpdateViewCounter(nade);

    return nade;
  };

  getBySlug = async (slug: string): Promise<NadeDTO> => {
    const nade = await this.nadeRepo.getBySlug(slug);
    await this.tryUpdateViewCounter(nade);

    return nade;
  };

  getByMap = async (map: CsgoMap): Promise<NadeMiniDto[]> => {
    const nades = await this.nadeRepo.getByMap(map);

    return convertNadesToLightDto(nades);
  };

  getByUser = async (steamId: string): Promise<NadeMiniDto[]> => {
    const nadesByUser = await this.nadeRepo.getByUser(steamId);

    return convertNadesToLightDto(nadesByUser);
  };

  save = async (
    body: NadeCreateDTO,
    steamID: string
  ): Promise<NadeDTO | null> => {
    const imageBuilder: NadeImages = {
      thumbnailId: "",
      thumbnailUrl: "",
    };

    const user = await this.userRepo.byId(steamID);

    const userLight: UserLightModel = {
      nickname: user.nickname,
      avatar: user.avatar,
      steamId: user.steamId,
    };

    const gfycatData = await this.gfycatApi.getGfycatData(body.gfycat.gfyId);

    if (!gfycatData) {
      throw ErrorFactory.ExternalError(
        "Gfycat seems to be down. Try again later."
      );
    }

    const resultImage = await this.imageRepo.createThumbnail(
      body.imageBase64,
      "nades"
    );

    imageBuilder.thumbnailId = `${resultImage.collection}/${resultImage.id}`;
    imageBuilder.thumbnailUrl = resultImage.url;

    let lineupThumb: ImageData | undefined;

    if (body.lineUpImageBase64) {
      const lineupImage = await this.imageRepo.createLarge(
        body.lineUpImageBase64,
        "lineup"
      );
      lineupThumb = await this.imageRepo.createThumbnail(
        body.lineUpImageBase64,
        "lineup"
      );
      imageBuilder.lineupId = `${lineupImage.collection}/${lineupImage.id}`;
      imageBuilder.lineupUrl = lineupImage.url;
    }

    const hasLineUpImage = !!lineupThumb;

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
      ...(hasLineUpImage && { imageLineupThumb: lineupThumb }),
    };

    const nade = await this.nadeRepo.save(nadeModel);
    await this.statsRepo.incrementNadeCounter();
    await this.notificationRepo.newNade(nade.id);

    return nade;
  };

  delete = async (nadeId: string) => {
    const nade = await this.nadeRepo.getById(nadeId);

    await this.imageRepo.deleteImage(nade.images.thumbnailId);

    if (nade.images.lineupId) {
      await this.imageRepo.deleteImage(nade.images.lineupId);
    }

    await this.commentRepo.deleteForNadeId(nadeId);
    await this.favoriteRepo.deleteWhereNadeId(nadeId);
    await this.nadeRepo.delete(nade.id);
    await this.statsRepo.decrementNadeCounter();
  };

  update = async (
    nadeId: string,
    nadeUpdateDto: NadeUpdateDTO,
    user: RequestUser
  ): Promise<NadeDTO | null> => {
    const originalNade = await this.getById(nadeId);

    verifyAllowEdit(originalNade, user);
    verifyAdminFields(user, nadeUpdateDto);

    let newNadeData: Partial<NadeModel> = {
      gfycat: nadeUpdateDto.gfycat,
      startPosition: nadeUpdateDto.startPosition,
      endPosition: nadeUpdateDto.endPosition,
      description: nadeUpdateDto.description,
      map: nadeUpdateDto.map,
      movement: nadeUpdateDto.movement,
      technique: nadeUpdateDto.technique,
      tickrate: nadeUpdateDto.tickrate,
      type: nadeUpdateDto.type,
      mapEndCoord: nadeUpdateDto.mapEndCoord,
      status: nadeUpdateDto.status,
      slug: nadeUpdateDto.slug,
      oneWay: nadeUpdateDto.oneWay,
      isPro: nadeUpdateDto.isPro,
    };

    const mainImage = await this.replaceMainImageIfPresent(
      originalNade,
      nadeUpdateDto.imageBase64
    );

    if (mainImage) {
      newNadeData["imageMain"] = mainImage;
    }

    const lineupImages = await this.replaceLineUpImageIfPresent(
      originalNade,
      nadeUpdateDto.lineUpImageBase64
    );

    if (lineupImages) {
      newNadeData["imageLineupThumb"] = lineupImages.lineupImageThumb;
      newNadeData["imageLineup"] = lineupImages.lineupImage;
    }

    const updatedNade = await this.nadeRepo.update(nadeId, newNadeData, true);

    await this.handleNadeUpdateNotification(
      originalNade,
      originalNade.status,
      updatedNade.status
    );

    // #TODO Create Audit record

    return updatedNade;
  };

  private handleNadeUpdateNotification = async (
    nade: NadeDTO,
    oldStatus: NadeStatus,
    newStatus: NadeStatus
  ) => {
    const wasAccepted = newStatus === "accepted" && oldStatus !== "accepted";
    const wasDeclined = newStatus === "declined" && oldStatus !== "declined";

    if (wasAccepted) {
      await this.notificationRepo.nadeAccepted(nade);
    } else if (wasDeclined) {
      await this.notificationRepo.nadeDeclined(nade);
    }
  };

  private replaceLineUpImageIfPresent = async (
    originalNade: NadeDTO,
    lineupImageBase64?: string
  ) => {
    if (!lineupImageBase64) {
      return;
    }

    // Delete old
    if (originalNade.images.lineupId) {
      await this.imageRepo.deleteImage(originalNade.images.lineupId);
    }
    if (originalNade.imageLineupThumb) {
      await this.imageRepo.deleteImageResult(originalNade.imageLineupThumb);
    }

    const lineupImage = await this.imageRepo.createLarge(
      lineupImageBase64,
      "lineup"
    );
    const lineupImageThumb = await this.imageRepo.createThumbnail(
      lineupImageBase64,
      "lineup"
    );

    return {
      lineupImage,
      lineupImageThumb,
    };
  };

  private replaceMainImageIfPresent = async (
    originalNade: NadeDTO,
    mainImageBase64?: string
  ) => {
    if (!mainImageBase64) {
      return;
    }

    if (originalNade.images.thumbnailId) {
      await this.imageRepo.deleteImage(originalNade.images.thumbnailId);
    }

    const mainImage = await this.imageRepo.createThumbnail(
      mainImageBase64,
      "nades"
    );

    return mainImage;
  };

  private tryUpdateViewCounter = async (nade: NadeDTO): Promise<NadeDTO> => {
    if (!shouldUpdateNadeStats(nade)) {
      return nade;
    }

    const newNadeStats = await newStatsFromGfycat(
      nade.gfycat.gfyId,
      this.gfycatApi
    );

    if (!newNadeStats) {
      return nade;
    }

    const updatedNade = await this.nadeRepo.update(nade.id, newNadeStats);

    return updatedNade;
  };
}
