import moment from "moment";
import { CommentRepo } from "../comment/repository/CommentRepo";
import { GoogleApi } from "../external-api/GoogleApi";
import { FavoriteRepo } from "../favorite/repository/FavoriteRepo";
import { ImageRepo } from "../imageGallery/ImageGalleryService";
import { Logger } from "../logger/Logger";
import { MapEndLocationRepo } from "../maplocation/types/MapEndLocationRepo";
import { MapLocation, StartLocation } from "../maplocation/types/MapLocations";
import { MapStartLocationRepo } from "../maplocation/types/MapStartLocationRepo";
import { NotificationRepo } from "../notifications/repository/NotificationRepo";
import { StatsRepo } from "../stats/repository/StatsRepo";
import { UserLightModel } from "../user/UserModel";
import { UserRepo } from "../user/repository/UserRepo";
import { RequestUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import { NadeCreateDto, NadeEloGame } from "./dto/NadeCreateDto";
import { NadeCreateModel } from "./dto/NadeCreateModel";
import { NadeDto } from "./dto/NadeDto";
import { NadeFireModel } from "./dto/NadeFireModel";
import { NadeMiniDto } from "./dto/NadeMiniDto";
import { NadeUpdateDto } from "./dto/NadeUpdateDto";
import { CsMap } from "./nadeSubTypes/CsgoMap";
import { GameMode } from "./nadeSubTypes/GameMode";
import { NadeStatus } from "./nadeSubTypes/NadeStatus";
import { NadeType } from "./nadeSubTypes/NadeType";
import { TeamSide } from "./nadeSubTypes/TeamSide";
import { Tickrate } from "./nadeSubTypes/Tickrate";
import { NadeRepo } from "./repository/NadeRepo";
import { eloRating } from "./utils/EloUtils";
import {
  convertNadesToLightDto,
  convertToNadeMiniDto,
  shouldUpdateYouTubeViewCount,
  titleCase,
  verifyAdminFields,
  verifyAllowEdit,
} from "./utils/NadeUtils";

export type NadeServiceDeps = {
  commentRepo: CommentRepo;
  favoriteRepo: FavoriteRepo;
  googleApi: GoogleApi;
  imageRepo: ImageRepo;
  nadeRepo: NadeRepo;
  notificationRepo: NotificationRepo;
  statsRepo: StatsRepo;
  userRepo: UserRepo;
  mapStartLocationRepo: MapStartLocationRepo;
  mapEndLocationRepo: MapEndLocationRepo;
};

type LocationByMapFilters = {
  csMap: CsMap;
  nadeType: NadeType;
  gameMode: GameMode;
  tickRate: Tickrate;
  teamSide: TeamSide;
  showFavorites?: boolean;
};

export class NadeService {
  private commentRepo: CommentRepo;
  private favoriteRepo: FavoriteRepo;
  private googleApi: GoogleApi;
  private imageRepo: ImageRepo;
  private nadeRepo: NadeRepo;
  private notificationRepo: NotificationRepo;
  private statsRepo: StatsRepo;
  private userRepo: UserRepo;
  private mapEndLocationRepo: MapEndLocationRepo;
  private mapStartLocationRepo: MapStartLocationRepo;

  constructor(deps: NadeServiceDeps) {
    const {
      imageRepo,
      nadeRepo,
      statsRepo,
      commentRepo,
      notificationRepo,
      favoriteRepo,
      userRepo,
      googleApi,
      mapEndLocationRepo,
      mapStartLocationRepo,
    } = deps;

    this.nadeRepo = nadeRepo;
    this.imageRepo = imageRepo;
    this.statsRepo = statsRepo;
    this.commentRepo = commentRepo;
    this.notificationRepo = notificationRepo;
    this.favoriteRepo = favoriteRepo;
    this.userRepo = userRepo;
    this.googleApi = googleApi;
    this.mapEndLocationRepo = mapEndLocationRepo;
    this.mapStartLocationRepo = mapStartLocationRepo;

    // this.recountNades();
    // this.recountNadesCs2Nades();
    this.getDeletedToRemove();
    this.markOldDeclinedNadesAsRemoved();
  }

  private recountNades = async () => {
    const allNades = await Promise.all([
      this.getByMap("ancient", undefined, "csgo"),
      this.getByMap("anubis", undefined, "csgo"),
      this.getByMap("cache", undefined, "csgo"),
      this.getByMap("dust2", undefined, "csgo"),
      this.getByMap("inferno", undefined, "csgo"),
      this.getByMap("mirage", undefined, "csgo"),
      this.getByMap("nuke", undefined, "csgo"),
      this.getByMap("overpass", undefined, "csgo"),
      this.getByMap("train", undefined, "csgo"),
      this.getByMap("tuscan", undefined, "csgo"),
      this.getByMap("vertigo", undefined, "csgo"),
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

  private recountNadesCs2Nades = async () => {
    const allNades = await Promise.all([
      this.getByMap("ancient", undefined, "cs2"),
      this.getByMap("anubis", undefined, "cs2"),
      this.getByMap("cache", undefined, "cs2"),
      this.getByMap("dust2", undefined, "cs2"),
      this.getByMap("inferno", undefined, "cs2"),
      this.getByMap("mirage", undefined, "cs2"),
      this.getByMap("nuke", undefined, "cs2"),
      this.getByMap("overpass", undefined, "cs2"),
      this.getByMap("train", undefined, "cs2"),
      this.getByMap("tuscan", undefined, "cs2"),
      this.getByMap("vertigo", undefined, "cs2"),
    ]);

    const flatNades: NadeMiniDto[] = [].concat.apply([], allNades);

    const numSmokes = flatNades.filter((n) => n.type === "smoke").length;
    const numFlashes = flatNades.filter((n) => n.type === "flash").length;
    const numMolotovs = flatNades.filter((n) => n.type === "molotov").length;
    const numGrenades = flatNades.filter((n) => n.type === "hegrenade").length;

    Logger.verbose(
      "Recounting cs2 nades",
      numSmokes,
      numFlashes,
      numMolotovs,
      numGrenades
    );

    this.statsRepo.setCs2NadeCount(
      numSmokes,
      numFlashes,
      numMolotovs,
      numGrenades
    );
  };

  getByStartAndEndLocation = async (
    startLocationId: string,
    endLocationId: string
  ): Promise<NadeMiniDto[]> => {
    const result = await this.nadeRepo.getByStartAndEndLocation(
      startLocationId,
      endLocationId
    );

    return result.map((n) => convertToNadeMiniDto(n));
  };

  getFlagged = async () => {
    const nades = await this.nadeRepo.getRecent();

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

  getRecent = async (gameMode: GameMode): Promise<NadeMiniDto[]> => {
    const nades = await this.nadeRepo.getRecent(gameMode);

    return convertNadesToLightDto(nades);
  };

  getPending = async (): Promise<NadeDto[]> => {
    const pendingNades = await this.nadeRepo.getPending();
    const sortedArray = pendingNades.sort(
      (a, b) => a.createdAt.valueOf() - b.createdAt.valueOf()
    );

    return sortedArray;
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
    map: CsMap,
    nadeType?: NadeType,
    gameMode?: GameMode
  ): Promise<NadeMiniDto[]> => {
    const nades = await this.nadeRepo.getByMap(map, nadeType, gameMode);

    return convertNadesToLightDto(nades);
  };

  getLocationsByMap = async (
    filters: LocationByMapFilters,
    steamId?: string
  ): Promise<MapLocation[]> => {
    const startLocations =
      await this.mapStartLocationRepo.getNadeStartLocations(
        filters.csMap,
        filters.gameMode
      );
    const endLocations = await this.mapEndLocationRepo.getMapEndLocations(
      filters.csMap,
      filters.nadeType,
      filters.gameMode
    );
    let nades: NadeDto[] = [];

    if (filters.showFavorites && steamId) {
      nades = await this.getFavoritedNades(steamId, filters);
    } else {
      nades = await this.getNormalNades(
        filters.csMap,
        filters.nadeType,
        filters.gameMode,
        filters.tickRate,
        filters.teamSide
      );
    }

    const mapLocations: MapLocation[] = [];

    // Iterate through endLocations and construct MapLocation objects
    for (const endLocation of endLocations) {
      const relatedStartLocations: StartLocation[] = [];

      // Find all nades that are thrown to this position
      const nadesThrownToEndLocation = nades.filter(
        (nade) => nade.mapEndLocationId === endLocation.id
      );

      const nadeEndLocationCount = nadesThrownToEndLocation.length;
      let endLocationHasNew = false; // Track if any nades in endLocation are new

      if (!nadeEndLocationCount) {
        continue;
      }

      for (const startNade of nadesThrownToEndLocation) {
        const nadeStartLocation = relatedStartLocations.find(
          (n) => n.id === startNade.mapStartLocationId
        );
        if (nadeStartLocation) {
          nadeStartLocation.count = nadeStartLocation.count + 1;
          if (startNade.isNew) {
            nadeStartLocation.hasNew = true;
            endLocationHasNew = true;
          }
        } else {
          const startPos = startLocations.find(
            (sL) => sL.id === startNade.mapStartLocationId
          );
          if (!startPos) continue;
          const isNew = startNade.isNew ? true : false;
          relatedStartLocations.push({
            ...startPos,
            count: 1,
            hasNew: isNew,
          });
          if (isNew) {
            endLocationHasNew = true;
          }
        }
      }

      const mapLocation: MapLocation = {
        endLocation: {
          ...endLocation,
          count: nadeEndLocationCount,
          hasNew: endLocationHasNew,
        },
        startPositions: relatedStartLocations,
      };
      mapLocations.push(mapLocation);
    }

    return mapLocations;
  };

  private getNormalNades = async (
    csMap: CsMap,
    nadeType: NadeType,
    gameMode: GameMode,
    tickRate: Tickrate,
    teamSide: TeamSide
  ) => {
    let nadeResult = await this.nadeRepo.getByMap(csMap, nadeType, gameMode);

    if (tickRate === "tick128") {
      nadeResult = nadeResult.filter((n) => n.tickrate !== "tick64");
    } else if (tickRate === "tick64") {
      nadeResult = nadeResult.filter((n) => n.tickrate !== "tick128");
    }

    if (teamSide === "counterTerrorist") {
      nadeResult = nadeResult.filter((n) => n.teamSide !== "terrorist");
    } else if (teamSide === "terrorist") {
      nadeResult = nadeResult.filter((n) => n.teamSide !== "counterTerrorist");
    }

    const nades = nadeResult.filter(
      (n) => n.mapEndLocationId && n.mapStartLocationId
    );
    return nades;
  };

  private getFavoritedNades = async (
    steamId: string,
    filters: LocationByMapFilters
  ) => {
    const favorites = await this.favoriteRepo.byUser(steamId);
    const nadesToFetch = favorites.map((f) => f.nadeId);
    let result = await this.nadeRepo.getListOfNades(nadesToFetch);
    result = result
      .filter((n) => n.map === filters.csMap)
      .filter((n) => n.type === filters.nadeType)
      .filter((n) => n.mapEndLocationId && n.mapStartLocationId);

    if (filters.tickRate === "tick128") {
      result = result.filter((n) => n.tickrate !== "tick64");
    } else if (filters.tickRate === "tick64") {
      result = result.filter((n) => n.tickrate !== "tick128");
    }

    if (filters.teamSide === "counterTerrorist") {
      result = result.filter((n) => n.teamSide !== "terrorist");
    } else if (filters.teamSide === "terrorist") {
      result = result.filter((n) => n.teamSide !== "counterTerrorist");
    }

    return result;
  };

  getByUser = async (
    steamId: string,
    map?: CsMap,
    gameMode?: GameMode
  ): Promise<NadeMiniDto[]> => {
    const nadesByUser = await this.nadeRepo.getByUser(steamId, map, gameMode);

    return convertNadesToLightDto(nadesByUser);
  };

  save = async (body: NadeCreateDto, steamID: string): Promise<NadeDto> => {
    const user = await this.userRepo.byId(steamID);
    const mapEndLocation = await this.mapEndLocationRepo.getById(
      body.mapEndLocationId
    );
    const mapStartLocation = await this.mapStartLocationRepo.getById(
      body.mapStartLocationId
    );

    if (!user) {
      throw ErrorFactory.BadRequest("User not found when creating nade");
    }

    if (!mapEndLocation || !mapStartLocation) {
      throw ErrorFactory.InternalServerError("Start or end location not found");
    }

    const userLight: UserLightModel = {
      nickname: user.nickname,
      avatar: user.avatar,
      steamId: user.steamId,
    };

    const { imageLineupThumb, lineupImage, resultImage, resultImageThumb } =
      await this.saveImages(body.imageBase64, body.lineUpImageBase64);

    const nadeModel: NadeCreateModel = {
      commentCount: 0,
      description: body.description,
      endPosition: mapEndLocation.calloutName,
      favoriteCount: 0,
      gameMode: body.gameMode || "csgo",
      imageLineup: lineupImage,
      imageLineupThumb: imageLineupThumb,
      imageMain: resultImage,
      imageMainThumb: resultImageThumb,
      map: body.map,
      mapEndLocationId: body.mapEndLocationId,
      mapStartLocationId: body.mapStartLocationId,
      movement: body.movement,
      oneWay: body.oneWay,
      proUrl: body.proUrl,
      setPos: body.setPos,
      startPosition: mapStartLocation.calloutName,
      steamId: userLight.steamId,
      teamSide: body.teamSide,
      technique: body.technique,
      tickrate: body.tickrate,
      type: body.type,
      user: userLight,
      viewCount: 0,
      youTubeId: body.youTubeId,
    };

    const nade = await this.nadeRepo.save(nadeModel);

    await this.statsRepo.incrementNadeCounter(nade.type);

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

    await this.statsRepo.decrementNadeCounter(nade.type);
    await this.userRepo.decrementNadeCount(nade.user.steamId);

    const deleteParts = [
      ...this.getDeleteImagePromises(nade),
      this.commentRepo.deleteForNadeId(nadeId),
      this.favoriteRepo.deleteWhereNadeId(nadeId),
      this.nadeRepo.delete(nade.id),
    ];

    await Promise.all(deleteParts);
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

    const mainImages = await this.replaceMainImageIfPresent(
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
      imageLineup: lineupImages?.lineupImage,
      imageLineupThumb: lineupImages?.lineupImageThumb,
      imageMain: mainImages?.mainImage,
      imageMainThumb: mainImages?.mainImageSmall,
      isPro: updates.isPro,
      map: updates.map,
      mapEndLocationId: updates.mapEndLocationId,
      mapStartLocationId: updates.mapStartLocationId,
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
      youTubeId: updates.youTubeId,
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
    }

    return updatedNade;
  };

  performNadeComparison = async (eloGame: NadeEloGame) => {
    const nadeOne = await this.getById(eloGame.nadeOneId);
    const nadeTwo = await this.getById(eloGame.nadeTwoId);
    if (!nadeOne || !nadeTwo) {
      console.log("Could not find a nade that was in the elo game");
      return;
    }

    const { nadeOneNewElo, nadeTwoNewElo } = eloRating(
      nadeOne,
      nadeTwo,
      eloGame.winnerId
    );

    this.nadeRepo.updateNade(
      nadeOne.id,
      { eloScore: nadeOneNewElo },
      { invalidateCache: true }
    );
    this.nadeRepo.updateNade(
      nadeTwo.id,
      { eloScore: nadeTwoNewElo },
      { invalidateCache: true }
    );
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
    if (
      nade.slug ||
      !nade.map ||
      !nade.endPosition ||
      !nade.type ||
      !nade.gameMode
    ) {
      return;
    }

    const cleanEndPosition = nade.endPosition
      .toLowerCase()
      .replace(/[^0-9a-z\-]/gi, "") // Remove special characters
      .replace(/\s+/g, " ") // Remove any double spaces
      .trim() // Trim string
      .split(" ")
      .join("-");

    const baseSlug = `${nade.gameMode}-${
      nade.map
    }-${cleanEndPosition}-${this.typeSlug(nade.type)}`;

    // Check base slug
    const baseSlugWorks = await this.isSlugAvailable(baseSlug);
    if (baseSlugWorks) {
      return this.nadeRepo.updateNade(
        nade.id,
        { slug: baseSlug },
        { setNewUpdatedAt: true, invalidateCache: true }
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
      { setNewUpdatedAt: true, invalidateCache: true }
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
    if (originalNade.imageMainThumb) {
      await this.imageRepo.deleteImageResult(originalNade.imageMainThumb);
    }

    const mainImageSmall = await this.imageRepo.createThumbnail(
      mainImageBase64,
      "nades"
    );

    const mainImage = await this.imageRepo.createMedium(
      mainImageBase64,
      "nades"
    );

    return { mainImageSmall, mainImage };
  };

  private tryUpdateViewCounter = async (nade: NadeDto) => {
    const { youTubeId } = nade;
    const shouldUpdate = shouldUpdateYouTubeViewCount(nade);
    if (!youTubeId || !shouldUpdate) {
      return;
    }

    const viewCount = await this.googleApi.getYouTubeVideoViewCount(youTubeId);

    Logger.info(`NadeService.tryUpdateViewCounter | YouTube - ${nade.id}`);

    this.nadeRepo.updateNade(nade.id, {
      viewCount,
      lastGfycatUpdate: new Date(),
    });
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
    const resultImageMediumPromise = this.imageRepo.createMedium(
      mainImageBase64,
      "nades"
    );

    const resultImageThumbPromise = this.imageRepo.createThumbnail(
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

    const [resultImage, resultImageThumb, lineupImage, imageLineupThumb] =
      await Promise.all([
        resultImageMediumPromise,
        resultImageThumbPromise,
        lineupImagePromise,
        imageLineupThumbPromise,
      ]);

    return {
      resultImage,
      resultImageThumb,
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
