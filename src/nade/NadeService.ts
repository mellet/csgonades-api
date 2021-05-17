import { CommentRepo } from "../comment/repository/CommentRepo";
import { GfycatApi } from "../external-api/GfycatApi";
import { FavoriteRepo } from "../favorite/repository/FavoriteRepo";
import { ImageRepo } from "../imageGallery/ImageGalleryService";
import { NotificationRepo } from "../notifications/repository/NotificationRepo";
import { StatsRepo } from "../stats/repository/StatsRepo";
import { UserRepo } from "../user/repository/UserRepo";
import { UserLightModel } from "../user/UserModel";
import { RequestUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import { NadeCreateDto } from "./dto/NadeCreateDto";
import { NadeCreateModel } from "./dto/NadeCreateModel";
import { NadeDto } from "./dto/NadeDto";
import { NadeFireModel } from "./dto/NadeFireModel";
import { NadeMiniDto } from "./dto/NadeMiniDto";
import { NadeUpdateDto } from "./dto/NadeUpdateDto";
import { CsgoMap } from "./nadeSubTypes/CsgoMap";
import { NadeStatus } from "./nadeSubTypes/NadeStatus";
import { NadeType } from "./nadeSubTypes/NadeType";
import { NadeRepo } from "./repository/NadeRepo";
import {
  convertNadesToLightDto,
  newStatsFromGfycat,
  shouldUpdateNadeStats,
  verifyAdminFields,
  verifyAllowEdit,
} from "./utils/NadeUtils";

export type NadeServiceDeps = {
  nadeRepo: NadeRepo;
  commentRepo: CommentRepo;
  statsRepo: StatsRepo;
  imageRepo: ImageRepo;
  gfycatApi: GfycatApi;
  notificationRepo: NotificationRepo;
  favoriteRepo: FavoriteRepo;
  userRepo: UserRepo;
};

export class NadeService {
  private nadeRepo: NadeRepo;
  private userRepo: UserRepo;
  private imageRepo: ImageRepo;
  private gfycatApi: GfycatApi;
  private statsRepo: StatsRepo;
  private commentRepo: CommentRepo;
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
      userRepo,
    } = deps;

    this.nadeRepo = nadeRepo;
    this.imageRepo = imageRepo;
    this.gfycatApi = gfycatApi;
    this.statsRepo = statsRepo;
    this.commentRepo = commentRepo;
    this.notificationRepo = notificationRepo;
    this.favoriteRepo = favoriteRepo;
    this.userRepo = userRepo;
  }

  getFlagged = async () => {
    const nades = await this.nadeRepo.getAll();

    const missingTeam = nades.filter((n) => !n.teamSide);
    const missingLineup = nades.filter((n) => {
      const hasLineup = !!n.imageLineupThumb;
      return !hasLineup;
    });

    const combined = [...missingTeam, ...missingLineup];

    return combined.filter((n) => n.map !== "cobblestone");
  };

  isSlugAvailable = async (slug: string) => {
    return this.nadeRepo.isSlugAvailable(slug);
  };

  favoriteNade = async (nadeId: string, steamId: string) => {
    const nade = await this.getById(nadeId);
    const userFavoriting = await this.userRepo.byId(steamId);

    if (!nade || !userFavoriting) {
      throw ErrorFactory.NotFound("Nade or user not found");
    }

    const isOwnNade = nade.steamId === steamId;

    const favorite = await this.favoriteRepo.addFavorite({
      nadeId,
      userId: steamId,
    });

    await this.nadeRepo.incrementFavoriteCount(nadeId);

    if (!isOwnNade) {
      await this.notificationRepo.newFavorite(nade, userFavoriting);
    }

    return favorite;
  };

  unFavoriteNade = async (nadeId: string, steamId: string) => {
    const nade = await this.getById(nadeId);

    if (!nade) {
      throw ErrorFactory.NotFound(`Nade not found, ${nadeId}`);
    }

    const isOwnNade = nade.steamId === steamId;

    await this.favoriteRepo.reomveFavoriteForNade(nadeId, steamId);
    await this.nadeRepo.decrementFavoriteCount(nadeId);

    if (!isOwnNade) {
      await this.notificationRepo.removeFavoriteNotification({
        bySteamId: steamId,
        nadeId,
      });
    }
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

  getById = async (nadeId: string): Promise<NadeDto> => {
    const nade = await this.nadeRepo.getById(nadeId);
    await this.tryUpdateViewCounter(nade);

    return nade;
  };

  getBySlug = async (slug: string): Promise<NadeDto> => {
    const nade = await this.nadeRepo.getBySlug(slug);
    await this.tryUpdateViewCounter(nade);

    return nade;
  };

  getByMap = async (
    map: CsgoMap,
    nadeType?: NadeType
  ): Promise<NadeMiniDto[]> => {
    const nades = await this.nadeRepo.getByMap(map, nadeType);

    return convertNadesToLightDto(nades);
  };

  getByUser = async (
    steamId: string,
    map?: CsgoMap
  ): Promise<NadeMiniDto[]> => {
    const nadesByUser = await this.nadeRepo.getByUser(steamId, map);

    return convertNadesToLightDto(nadesByUser);
  };

  save = async (
    body: NadeCreateDto,
    steamID: string
  ): Promise<NadeDto | null> => {
    const user = await this.userRepo.byId(steamID);

    if (!user) {
      throw ErrorFactory.BadRequest("User not found");
    }

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

    const { imageLineupThumb, lineupImage, resultImage } =
      await this.saveImages(body.imageBase64, body.lineUpImageBase64);

    const nadeModel: NadeCreateModel = {
      commentCount: 0,
      description: body.description,
      endPosition: body.endPosition,
      favoriteCount: 0,
      gfycat: body.gfycat,
      imageLineupThumb: imageLineupThumb,
      imageLineup: lineupImage,
      imageMain: resultImage,
      map: body.map,
      mapEndCoord: body.mapEndCoord,
      movement: body.movement,
      setPos: body.setPos,
      startPosition: body.startPosition,
      steamId: userLight.steamId,
      teamSide: body.teamSide,
      technique: body.technique,
      tickrate: body.tickrate,
      type: body.type,
      user: userLight,
      viewCount: gfycatData.gfyItem.views,
    };

    const nade = await this.nadeRepo.save(nadeModel);
    await this.statsRepo.incrementNadeCounter();
    await this.notificationRepo.newNade(nade.id);

    return nade;
  };

  delete = async (nadeId: string) => {
    const nade = await this.nadeRepo.getById(nadeId);

    await this.imageRepo.deleteImageResult(nade.imageMain);

    if (nade.imageLineup) {
      await this.imageRepo.deleteImageResult(nade.imageLineup);
    }
    if (nade.imageLineupThumb) {
      await this.imageRepo.deleteImageResult(nade.imageLineupThumb);
    }

    await this.commentRepo.deleteForNadeId(nadeId);
    await this.favoriteRepo.deleteWhereNadeId(nadeId);
    await this.nadeRepo.delete(nade.id);
    await this.statsRepo.decrementNadeCounter();
  };

  update = async (
    nadeId: string,
    nadeUpdateDto: NadeUpdateDto,
    user: RequestUser
  ): Promise<NadeDto | null> => {
    const originalNade = await this.getById(nadeId);

    verifyAllowEdit(originalNade, user);
    verifyAdminFields(user, nadeUpdateDto);

    let newNadeData: Partial<NadeFireModel> = {
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
      teamSide: nadeUpdateDto.teamSide,
      setPos: nadeUpdateDto.setPos,
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

    return updatedNade;
  };

  private handleNadeUpdateNotification = async (
    nade: NadeDto,
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
    originalNade: NadeDto,
    lineupImageBase64?: string
  ) => {
    if (!lineupImageBase64) {
      return;
    }
    if (originalNade.imageLineupThumb) {
      await this.imageRepo.deleteImageResult(originalNade.imageLineupThumb);
    }
    if (originalNade.imageLineup) {
      await this.imageRepo.deleteImageResult(originalNade.imageLineup);
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
    originalNade: NadeDto,
    mainImageBase64?: string
  ) => {
    if (!mainImageBase64) {
      return;
    }

    await this.imageRepo.deleteImageResult(originalNade.imageMain);

    const mainImage = await this.imageRepo.createThumbnail(
      mainImageBase64,
      "nades"
    );

    return mainImage;
  };

  private tryUpdateViewCounter = async (nade: NadeDto): Promise<NadeDto> => {
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

  private saveImages = async (
    mainImageBase64: string,
    lineUpImageBase64: string
  ) => {
    const resultImagePromise = this.imageRepo.createThumbnail(
      mainImageBase64,
      "nades"
    );

    const lineupImagePromise = this.imageRepo.createLarge(
      lineUpImageBase64,
      "lineup"
    );

    const imageLineupThumbPromise = this.imageRepo.createThumbnail(
      lineUpImageBase64,
      "lineup"
    );

    const [resultImage, lineupImage, imageLineupThumb] = await Promise.all([
      resultImagePromise,
      lineupImagePromise,
      imageLineupThumbPromise,
    ]);

    return {
      resultImage,
      lineupImage,
      imageLineupThumb,
    };
  };
}
