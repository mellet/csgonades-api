import { NadeRepo } from "./NadeRepo";
import {
  Nade,
  NadeBody,
  makeNadeFromBody,
  CsgoMap,
  NadeUpdateBody,
  updatedNadeMerge,
  GfycatData,
  NadeStats
} from "./Nade";
import { ImageStorageService } from "../services/ImageStorageService";
import { GfycatService } from "../services/GfycatService";
import { SteamService } from "../steam/SteamService";
import axios from "axios";
import { UserService } from "../user/UserService";
import { CSGNUser } from "../user/User";

export interface NadeService {
  fetchNades(limit?: number): Promise<Nade[]>;
  fetchByID(nadeId: string): Promise<Nade>;
  fetchByMap(map: CsgoMap): Promise<Nade[]>;
  saveFromBody(body: NadeBody, steamID: string): Promise<Nade>;
  isAllowedEdit(nadeId: string, steamId: string): Promise<boolean>;
  update(updateFields: NadeUpdateBody, nadeId: string): Promise<Nade>;
}

export const makeNadeService = (
  nadeRepo: NadeRepo,
  userService: UserService,
  imageStorageService: ImageStorageService,
  gfycatService: GfycatService
): NadeService => {
  const fetchNades = async (limit: number = 10): Promise<Nade[]> => {
    const nades = await nadeRepo.get(limit);

    return nades;
  };

  const fetchByID = async (nadeId: string): Promise<Nade> => {
    const nade = await nadeRepo.byID(nadeId);

    return nade;
  };

  const fetchByMap = async (map: CsgoMap): Promise<Nade[]> => {
    const nades = await nadeRepo.byMap(map);

    return nades;
  };

  const saveFromBody = async (
    body: NadeBody,
    steamID: string
  ): Promise<Nade> => {
    const user = await userService.bySteamID(steamID);

    if (!user) {
      throw new Error("User not found");
    }

    const gfycatData = await gfycatService.getGfycatData(body.gfycatIdOrUrl);
    const nadeImages = await imageStorageService.saveImage(body.imageBase64);
    const tmpNade = makeNadeFromBody(body, user, gfycatData, nadeImages);
    const nade = await nadeRepo.save(tmpNade);

    return nade;
  };

  const isAllowedEdit = async (nadeId: string, steamId: string) => {
    try {
      const nade = await nadeRepo.byID(nadeId);
      const user = await userService.bySteamID(steamId);

      if (user.role === "admin" || user.role === "moderator") {
        return true;
      }

      if (nade.steamId === user.steamID) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("NadeService.isAllowedEdit", error);
      return false;
    }
  };

  const update = async (updateFields: NadeUpdateBody, nadeId: string) => {
    const oldNade = await nadeRepo.byID(nadeId);

    let newGfyData: GfycatData;
    let newUser: CSGNUser;
    let newStats: NadeStats;

    if (updateFields.gfycatIdOrUrl) {
      const { gfyItem } = await gfycatService.getGfycatData(
        updateFields.gfycatIdOrUrl
      );
      newGfyData = {
        gfyId: gfyItem.gfyId,
        smallVideoUrl: gfyItem.mobileUrl
      };
      newStats = {
        ...oldNade.stats,
        views: gfyItem.views
      };
    }

    if (updateFields.steamId) {
      newUser = await userService.getOrCreateUser(updateFields.steamId);
    }

    const mergedNade = updatedNadeMerge(
      updateFields,
      oldNade,
      newUser,
      newGfyData,
      newStats
    );

    const updatedNade = await nadeRepo.update(mergedNade);
    return updatedNade;
  };

  return {
    fetchNades,
    fetchByMap,
    fetchByID,
    saveFromBody,
    isAllowedEdit,
    update
  };
};
