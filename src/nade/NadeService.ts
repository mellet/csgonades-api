import { GfycatDetailsResponse } from "gfycat-sdk";
import moment from "moment";
import { CommentRepo } from "../comment/repository/CommentRepo";
import { GfycatApi } from "../external-api/GfycatApi";
import { GoogleApi } from "../external-api/GoogleApi";
import { FavoriteRepo } from "../favorite/repository/FavoriteRepo";
import { ImageRepo } from "../imageGallery/ImageGalleryService";
import { Logger } from "../logger/Logger";
import { NotificationRepo } from "../notifications/repository/NotificationRepo";
import { StatsRepo } from "../stats/repository/StatsRepo";
import { UserLightModel } from "../user/UserModel";
import { UserRepo } from "../user/repository/UserRepo";
import { RequestUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import { NadeCreateDto } from "./dto/NadeCreateDto";
import { NadeCreateModel } from "./dto/NadeCreateModel";
import { NadeDto } from "./dto/NadeDto";
import { NadeFireModel } from "./dto/NadeFireModel";
import { NadeMiniDto } from "./dto/NadeMiniDto";
import { NadeUpdateDto } from "./dto/NadeUpdateDto";
import { CsgoMap } from "./nadeSubTypes/CsgoMap";
import { GameMode } from "./nadeSubTypes/GameMode";
import { NadeStatus } from "./nadeSubTypes/NadeStatus";
import { NadeType } from "./nadeSubTypes/NadeType";
import { NadeRepo } from "./repository/NadeRepo";
import {
  convertNadesToLightDto,
  newStatsFromGfycat,
  shouldUpdateNadeStats,
  titleCase,
  verifyAdminFields,
  verifyAllowEdit,
} from "./utils/NadeUtils";

export type NadeServiceDeps = {
  commentRepo: CommentRepo;
  favoriteRepo: FavoriteRepo;
  gfycatApi: GfycatApi;
  googleApi: GoogleApi;
  imageRepo: ImageRepo;
  nadeRepo: NadeRepo;
  notificationRepo: NotificationRepo;
  statsRepo: StatsRepo;
  userRepo: UserRepo;
};

export class NadeService {
  private commentRepo: CommentRepo;
  private favoriteRepo: FavoriteRepo;
  private gfycatApi: GfycatApi;
  private googleApi: GoogleApi;
  private imageRepo: ImageRepo;
  private nadeRepo: NadeRepo;
  private notificationRepo: NotificationRepo;
  private statsRepo: StatsRepo;
  private userRepo: UserRepo;

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
      googleApi,
    } = deps;

    this.nadeRepo = nadeRepo;
    this.imageRepo = imageRepo;
    this.gfycatApi = gfycatApi;
    this.statsRepo = statsRepo;
    this.commentRepo = commentRepo;
    this.notificationRepo = notificationRepo;
    this.favoriteRepo = favoriteRepo;
    this.userRepo = userRepo;
    this.googleApi = googleApi;

    // this.recountNades();
    this.getDeletedToRemove();
    this.markOldDeclinedNadesAsRemoved();
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

    Logger.verbose(
      "Recounting nades",
      numSmokes,
      numFlashes,
      numMolotovs,
      numGrenades
    );

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

    return combined;
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

    const favorite = await this.favoriteRepo.addFavorite({
      nadeId,
      userId: steamId,
    });

    await this.nadeRepo.incrementFavoriteCount(nadeId);

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

  getPending = async (): Promise<NadeDto[]> => {
    return this.nadeRepo.getPending();
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
      const addedDaysAgo = moment().diff(moment(nade.updatedAt), "days", false);
      return addedDaysAgo > 30;
    });

    const deletePromises = olderThanTwoMonths.map((nade) =>
      this.delete(nade.id, { role: "administrator", steamId: "none" })
    );
    await Promise.all(deletePromises);
  };

  private markOldDeclinedNadesAsRemoved = async () => {
    const declinedNades = await this.getDeclined();

    const oldDeclinedNades = declinedNades.filter((nade) => {
      const addedDaysAgo = moment().diff(moment(nade.createdAt), "days", false);
      return addedDaysAgo > 21;
    });

    oldDeclinedNades.forEach((nade) => {
      this.markAsDeleted(nade.id);
    });
  };

  getById = async (nadeId: string): Promise<NadeDto | null> => {
    const nade = await this.nadeRepo.getById(nadeId);
    return nade;
  };

  getBySlug = async (slug: string): Promise<NadeDto | null> => {
    const nade = await this.nadeRepo.getBySlug(slug);
    if (nade) {
      this.tryUpdateViewCounter(nade);
      this.setGameModeIfNotSet(nade);
    }

    return nade;
  };

  getByMap = async (
    map: CsgoMap,
    nadeType?: NadeType,
    gameMode?: GameMode
  ): Promise<NadeMiniDto[]> => {
    const nades = await this.nadeRepo.getByMap(map, nadeType, gameMode);

    return convertNadesToLightDto(nades);
  };

  getByUser = async (
    steamId: string,
    map?: CsgoMap,
    gameMode?: GameMode
  ): Promise<NadeMiniDto[]> => {
    const nadesByUser = await this.nadeRepo.getByUser(steamId, map, gameMode);

    return convertNadesToLightDto(nadesByUser);
  };

  save = async (body: NadeCreateDto, steamID: string): Promise<NadeDto> => {
    const user = await this.userRepo.byId(steamID);

    if (!user) {
      throw ErrorFactory.BadRequest("User not found when creating nade");
    }

    const userLight: UserLightModel = {
      nickname: user.nickname,
      avatar: user.avatar,
      steamId: user.steamId,
    };

    let gfycatData: GfycatDetailsResponse | undefined = undefined;

    if (body.gfycat) {
      gfycatData = await this.gfycatApi.getGfycatData(body.gfycat.gfyId);

      if (!gfycatData) {
        throw ErrorFactory.ExternalError(
          "Gfycat seems to be down. Try again later."
        );
      }
    }

    const { imageLineupThumb, lineupImage, resultImage } =
      await this.saveImages(body.imageBase64, body.lineUpImageBase64);

    const nadeModel: NadeCreateModel = {
      commentCount: 0,
      description: body.description,
      endPosition: titleCase(body.endPosition),
      favoriteCount: 0,
      gameMode: body.gameMode || "csgo",
      gfycat: body.gfycat,
      imageLineup: lineupImage,
      imageLineupThumb: imageLineupThumb,
      imageMain: resultImage,
      map: body.map,
      mapEndCoord: body.mapEndCoord,
      movement: body.movement,
      oneWay: body.oneWay,
      proUrl: body.proUrl,
      setPos: body.setPos,
      startPosition: titleCase(body.startPosition),
      steamId: userLight.steamId,
      teamSide: body.teamSide,
      technique: body.technique,
      tickrate: body.tickrate,
      type: body.type,
      user: userLight,
      viewCount: gfycatData?.gfyItem.views || 0,
      youTubeId: body.youTubeId,
    };

    const nade = await this.nadeRepo.save(nadeModel);

    return nade;
  };

  delete = async (nadeId: string, user: RequestUser) => {
    const nade = await this.nadeRepo.getById(nadeId);

    if (!nade) {
      throw ErrorFactory.NotFound("Nade to delete not found");
    }

    if (user.steamId !== nade.steamId && user.role === "user") {
      throw ErrorFactory.Forbidden("Not allowed to delete this nade");
    }

    const deleteParts = [
      ...this.getDeleteImagePromises(nade),
      this.commentRepo.deleteForNadeId(nadeId),
      this.favoriteRepo.deleteWhereNadeId(nadeId),
      this.nadeRepo.delete(nade.id),
    ];

    await Promise.all(deleteParts);

    await this.statsRepo.decrementNadeCounter(nade.type);
    await this.userRepo.decrementNadeCount(nade.user.steamId);
  };

  private markAsDeleted = async (nadeId: string) => {
    const originalNade = await this.getById(nadeId);

    if (!originalNade) {
      Logger.error("NadeService.markAsDeleted - No nade found");
      throw ErrorFactory.NotFound("Can't find nade to update");
    }

    await this.nadeRepo.updateNade(nadeId, { status: "deleted" });
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
      description: updates.description,
      endPosition: updates.endPosition
        ? titleCase(updates.endPosition)
        : undefined,
      gameMode: updates.gameMode,
      gfycat: updates.youTubeId ? null : updates.gfycat,
      imageLineup: lineupImages?.lineupImage,
      imageLineupThumb: lineupImages?.lineupImageThumb,
      imageMain: mainImage,
      isPro: updates.isPro,
      map: updates.map,
      mapEndCoord: updates.mapEndCoord,
      movement: updates.movement,
      oneWay: updates.oneWay,
      proUrl: updates.proUrl,
      setPos: updates.setPos,
      startPosition: updates.startPosition
        ? titleCase(updates.startPosition)
        : undefined,
      status: newStatus,
      teamSide: updates.teamSide,
      technique: updates.technique,
      tickrate: updates.tickrate,
      type: updates.type,
      youTubeId: updates.gfycat ? null : updates.youTubeId,
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
      await this.userRepo.incrementNadeCount(user.steamId);
      if (updatedNade.type) {
        await this.statsRepo.incrementNadeCounter(updatedNade.type);
      }
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
    if (nade.youTubeId && shouldUpdateNadeStats(nade)) {
      const viewCount = await this.googleApi.getYouTubeVideoViewCount(
        nade.youTubeId
      );

      this.nadeRepo.updateNade(
        nade.id,
        {
          viewCount,
          lastGfycatUpdate: new Date(),
        },
        { invalidateCache: true }
      );
      return nade;
    }

    if (!shouldUpdateNadeStats(nade) || !nade.gfycat) {
      return nade;
    }

    const newNadeStats = await newStatsFromGfycat(
      nade.gfycat.gfyId,
      this.gfycatApi
    );

    if (!newNadeStats) {
      return nade;
    }

    const gameMode = nade.gameMode || "csgo"; // Update nades with no game mode to csgo

    const updatedNade = await this.nadeRepo.updateNade(
      nade.id,
      { ...newNadeStats, gameMode },
      {
        invalidateCache: true,
      }
    );

    return updatedNade;
  };

  private setGameModeIfNotSet(nade: NadeDto) {
    if (nade.gameMode) {
      return;
    }

    this.update(
      nade.id,
      { gameMode: "csgo" },
      { role: "administrator", steamId: "internal" }
    );
  }

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
