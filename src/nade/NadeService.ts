import moment from "moment";
import { CommentRepo } from "../comment/repository/CommentRepo";
import { GfycatApi } from "../external-api/GfycatApi";
import { FavoriteRepo } from "../favorite/repository/FavoriteRepo";
import { ImageRepo } from "../imageGallery/ImageGalleryService";
import { Logger } from "../logger/Logger";
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

    // this.recountNades();
    this.getDeletedToRemove();
  }

  recountNades = async () => {
    const allNades = await Promise.all([
      this.getByMap("ancient"),
      this.getByMap("cache"),
      this.getByMap("dust2"),
      this.getByMap("inferno"),
      this.getByMap("mirage"),
      this.getByMap("nuke"),
      this.getByMap("overpass"),
      this.getByMap("train"),
      this.getByMap("vertigo"),
    ]);

    const flatNades: NadeMiniDto[] = [].concat.apply([], allNades);

    const numSmokes = flatNades.filter((n) => n.type === "smoke").length;
    const numFlashes = flatNades.filter((n) => n.type === "flash").length;
    const numMolotovs = flatNades.filter((n) => n.type === "molotov").length;
    const numGrenades = flatNades.filter((n) => n.type === "hegrenade").length;

    this.statsRepo.setNadeCount(
      numSmokes,
      numFlashes,
      numMolotovs,
      numGrenades
    );
  };

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

  isSlugAvailable = async (slug: string): Promise<boolean> => {
    const slugAvailable = this.nadeRepo.isSlugAvailable(slug);
    return slugAvailable;
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

    await this.favoriteRepo.removeFavoriteForNade(nadeId, steamId);
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

  getDeleted = async () => {
    const declinedNades = await this.nadeRepo.getDeleted();

    return convertNadesToLightDto(declinedNades);
  };

  private getDeletedToRemove = async () => {
    const toDelete = await this.nadeRepo.getDeletedToRemove();

    const olderThanTwoMonths = toDelete.filter((nade) => {
      const addedDaysAgo = moment().diff(moment(nade.createdAt), "days", false);
      return addedDaysAgo > 60;
    });

    const deletePromises = olderThanTwoMonths.map((nade) =>
      this.delete(nade.id)
    );
    await Promise.all(deletePromises);
  };

  getById = async (nadeId: string): Promise<NadeDto | null> => {
    const nade = await this.nadeRepo.getById(nadeId);
    if (nade) {
      await this.tryUpdateViewCounter(nade);
    }

    return nade;
  };

  getBySlug = async (slug: string): Promise<NadeDto | null> => {
    const nade = await this.nadeRepo.getBySlug(slug);
    if (nade) {
      await this.tryUpdateViewCounter(nade);
    }

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

  save = async (body: NadeCreateDto, steamID: string): Promise<NadeDto> => {
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
    if (nade.type) {
      await this.statsRepo.incrementNadeCounter(nade.type);
    }
    await this.notificationRepo.newNade(nade.id);

    return nade;
  };

  delete = async (nadeId: string) => {
    const nade = await this.nadeRepo.getById(nadeId);

    if (!nade) {
      throw ErrorFactory.NotFound("Nade to delete not found");
    }

    const deleteParts = [
      ...this.getDeleteImagePromises(nade),
      this.commentRepo.deleteForNadeId(nadeId),
      this.favoriteRepo.deleteWhereNadeId(nadeId),
      this.nadeRepo.delete(nade.id),
    ];

    await Promise.all(deleteParts);

    if (nade.type) {
      await this.statsRepo.decrementNadeCounter(nade.type);
    }
  };

  update = async (
    nadeId: string,
    updates: NadeUpdateDto,
    user: RequestUser
  ): Promise<NadeDto> => {
    const originalNade = await this.getById(nadeId);

    if (!originalNade) {
      Logger.error("NadeService.update - No nade found");
      throw ErrorFactory.NotFound("Can't find nade to update");
    }

    verifyAllowEdit(originalNade, user);
    verifyAdminFields(user, updates);

    const mainImage = await this.replaceMainImageIfPresent(
      originalNade,
      updates.imageBase64
    );

    const lineupImages = await this.replaceLineUpImageIfPresent(
      originalNade,
      updates.lineUpImageBase64
    );

    const newStatus = this.statusAfterNadeUpdate(
      user,
      originalNade,
      updates.status
    );

    const didJustGetAccepted =
      newStatus === "accepted" && originalNade.status !== "accepted";

    let newNadeData: Partial<NadeFireModel> = {
      gfycat: updates.gfycat,
      startPosition: updates.startPosition,
      endPosition: updates.endPosition,
      description: updates.description,
      map: updates.map,
      movement: updates.movement,
      technique: updates.technique,
      tickrate: updates.tickrate,
      type: updates.type,
      mapEndCoord: updates.mapEndCoord,
      status: newStatus,
      oneWay: updates.oneWay,
      isPro: updates.isPro,
      teamSide: updates.teamSide,
      setPos: updates.setPos,
      imageMain: mainImage,
      imageLineup: lineupImages?.lineupImage,
      imageLineupThumb: lineupImages?.lineupImageThumb,
    };

    const updatedNade = await this.nadeRepo.updateNade(nadeId, newNadeData, {
      setNewCreatedAt: didJustGetAccepted,
      setNewUpdatedAt: true,
      invalidateCache: true,
    });

    await this.handleNadeUpdateNotification(
      originalNade,
      originalNade.status,
      updatedNade.status
    );

    if (didJustGetAccepted) {
      await this.setNadeSlug(updatedNade);
    }

    return updatedNade;
  };

  private statusAfterNadeUpdate = (
    user: RequestUser,
    originalNade: NadeDto,
    newStatus?: NadeStatus
  ): NadeStatus | undefined => {
    const isSelf = user.steamId === originalNade.steamId;
    const wasPreviouslyDeclined = originalNade.status === "declined";

    if (isSelf && wasPreviouslyDeclined) {
      return "pending";
    } else {
      return newStatus;
    }
  };

  private setNadeSlug = async (nade: NadeDto) => {
    if (nade.slug || !nade.map || !nade.endPosition || !nade.type) {
      return;
    }

    const cleanEndPosition = nade.endPosition
      .toLowerCase()
      .trim()
      .split(" ")
      .join("-")
      .replace(/[^0-9a-z\-]/gi, "");

    const baseSlug = `${nade.map}-${cleanEndPosition}-${this.typeSlug(
      nade.type
    )}`;

    // Check base slug
    const baseSlugWorks = await this.isSlugAvailable(baseSlug);
    if (baseSlugWorks) {
      return this.nadeRepo.updateNade(
        nade.id,
        { slug: baseSlug },
        { setNewUpdatedAt: true }
      );
    }

    // Find next iteration of slug
    let foundSlug: string | undefined = undefined;

    for (let i = 2; i < 100; i++) {
      const testSlug = baseSlug + "-" + i;
      const slugAvailable = await this.isSlugAvailable(testSlug);
      if (slugAvailable) {
        foundSlug = testSlug;
        break;
      }
    }

    return this.nadeRepo.updateNade(
      nade.id,
      { slug: foundSlug },
      { setNewUpdatedAt: true }
    );
  };

  private typeSlug(type: NadeType) {
    if (type === "hegrenade") {
      return "grenade";
    } else {
      return type;
    }
  }

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

    const updatedNade = await this.nadeRepo.updateNade(nade.id, newNadeStats, {
      invalidateCache: false,
    });

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

  private getDeleteImagePromises = (nade: NadeDto) => {
    const deleteImagePromises: Promise<void>[] = [];
    deleteImagePromises.push(this.imageRepo.deleteImageResult(nade.imageMain));
    if (nade.imageLineup) {
      deleteImagePromises.push(
        this.imageRepo.deleteImageResult(nade.imageLineup)
      );
    }
    if (nade.imageLineupThumb) {
      deleteImagePromises.push(
        this.imageRepo.deleteImageResult(nade.imageLineupThumb)
      );
    }

    return deleteImagePromises;
  };
}
