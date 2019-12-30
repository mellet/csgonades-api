import { NadeRepo } from "./NadeRepo";
import { err } from "neverthrow";
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
}

export class NadeService implements INadeService {
  private nadeRepo: NadeRepo;
  private userService: IUserService;
  private imageStorageService: IImageStorageService;
  private gfycatService: GfycatService;
  private statsService: StatsService;

  constructor(
    nadeRepo: NadeRepo,
    userService: IUserService,
    imageStorageService: IImageStorageService,
    gfycatService: GfycatService,
    statsService: StatsService
  ) {
    this.nadeRepo = nadeRepo;
    this.userService = userService;
    this.imageStorageService = imageStorageService;
    this.gfycatService = gfycatService;
    this.statsService = statsService;
  }

  fetchNades(limit: number = 10): AppResult<NadeModel[]> {
    return this.nadeRepo.get(limit);
  }

  fetchByID(nadeId: string): AppResult<NadeModel> {
    return this.nadeRepo.byID(nadeId);
  }

  fetchByIdList(ids: string[]): AppResult<NadeModel[]> {
    return this.nadeRepo.listByIds(ids);
  }

  fetchByMap(map: CsgoMap, nadeFilter: NadeFilter): AppResult<NadeModel[]> {
    return this.nadeRepo.byMap(map, nadeFilter);
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
    this.statsService.incrementNadeCounter();

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

    return true;
  }

  async isAllowedEdit(nadeId: string, steamId: string): Promise<boolean> {
    const nadeResult = await this.nadeRepo.byID(nadeId);
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

    return updateResult;
  }

  updateNadeStatus(
    nadeId: string,
    updatedStatus: NadeStatusDTO
  ): AppResult<NadeModel> {
    return this.nadeRepo.update(nadeId, updatedStatus);
  }

  updateNadesWithUser(
    steamId: string,
    user: UserLightModel
  ): AppResult<boolean> {
    return this.nadeRepo.updateUserOnNades(steamId, user);
  }
}
