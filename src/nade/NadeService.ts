import { NadeRepo } from "./NadeRepo";
import { err, ok, Result } from "neverthrow";
import {
  NadeCreateDTO,
  makeNadeFromBody,
  CsgoMap,
  NadeUpdateDTO,
  updatedNadeMerge,
  GfycatData,
  NadeStats,
  NadeModel,
  NadeStatus,
  NadeStatusDTO
} from "./Nade";
import { IImageStorageService } from "../services/ImageStorageService";
import { GfycatService } from "../services/GfycatService";
import { IUserService } from "../user/UserService";
import { UserModel, UserLightModel } from "../user/UserModel";
import { AppResult } from "../utils/Common";
import { ErrorGenerator } from "../utils/ErrorUtil";
import { StatsService } from "../stats/StatsService";

export interface INadeService {
  fetchNades(limit?: number): AppResult<NadeModel[]>;
  fetchByID(nadeId: string): AppResult<NadeModel>;
  fetchByIdList(ids: string[]): AppResult<NadeModel[]>;
  fetchByMap(map: CsgoMap): AppResult<NadeModel[]>;
  fetchByUser(steamId: string): AppResult<NadeModel[]>;
  saveFromBody(body: NadeCreateDTO, steamID: string): AppResult<NadeModel>;
  isAllowedEdit(nadeId: string, steamId: string): Promise<boolean>;
  update(nadeId: string, updateFields: NadeUpdateDTO): AppResult<NadeModel>;
  forceUserUpdate(nadeId: string, newSteamId: string): AppResult<NadeModel>;
  updateNadeStatus(
    nadeId: string,
    updatedStatus: NadeStatusDTO
  ): AppResult<NadeModel>;
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

  async fetchNades(limit: number = 10): AppResult<NadeModel[]> {
    const result = await this.nadeRepo.get(limit);

    return result;
  }

  async fetchByID(nadeId: string): AppResult<NadeModel> {
    const result = await this.nadeRepo.byID(nadeId);

    return result;
  }

  fetchByIdList(ids: string[]): AppResult<NadeModel[]> {
    return this.nadeRepo.listByIds(ids);
  }

  fetchByMap(map: CsgoMap): AppResult<NadeModel[]> {
    return this.nadeRepo.byMap(map);
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
      throw new Error("User not found");
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
      return err(gfycatDataResult.error);
    }

    const gfycatData = gfycatDataResult.value;

    const nadeImages = await this.imageStorageService.saveImage(
      body.imageBase64
    );

    const tmpNade = makeNadeFromBody(userLight, gfycatData, nadeImages);
    const nade = await this.nadeRepo.save(tmpNade);
    this.statsService.incrementNadeCounter();

    return nade;
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
      const { error } = userResult;
      console.error(error);
      return ErrorGenerator.NOT_FOUND("User");
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

  async updateNadeStatus(
    nadeId: string,
    updatedStatus: NadeStatusDTO
  ): AppResult<NadeModel> {
    const result = await this.nadeRepo.update(nadeId, updatedStatus);
    return result;
  }
}
