import { GfycatDetailsResponse } from "gfycat-sdk";
import { UserLightModel, UserModel } from "../user/UserModel";
import { removeUndefines } from "../utils/Common";
import { NadeImages } from "../services/ImageStorageService";

export type CsgoMap = "notset" | "dust2" | "mirage" | "nuke" | "inferno";

type Movement = "notset" | "stationary" | "running" | "walking" | "crouching";

export type NadeStatus = "pending" | "accepted" | "declined" | "deleted";

export type MapSite = "a" | "b" | "mid";

type StatusInfo = string;

export type GfycatData = {
  gfyId: string;
  smallVideoUrl: string;
  largeVideoUrl: string;
};

type Technique =
  | "notset"
  | "mouseleft"
  | "mouseright"
  | "mouseboth"
  | "jumpthrow";

type Tickrate = "64tick" | "128 tick" | "Any";

type NadeType = "notset" | "smoke" | "flash" | "molotov" | "hegrenade";

export type NadeStats = {
  comments: number;
  favorited: number;
  views: number;
};

export interface NadeModel {
  title?: string;
  gfycat: GfycatData;
  images: NadeImages;
  steamId: string;
  user: UserLightModel;
  createdAt: Date;
  updatedAt: Date;
  lastGfycatUpdate: Date;
  status: NadeStatus;
  description?: string;
  map?: CsgoMap;
  movement?: Movement;
  technique?: Technique;
  tickrate?: Tickrate;
  type?: NadeType;
  statusInfo?: StatusInfo;
  mapSite?: MapSite;
  viewCount: number;
  favoriteCount: number;
}

export interface NadeDTO extends NadeModel {
  id: string;
}

export type NadeModelInsert = {
  gfycat: GfycatData;
  images: NadeImages;
  steamId: string;
  user: UserLightModel;
  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
  lastGfycatUpdate: FirebaseFirestore.FieldValue;
  status: NadeStatus;
  stats: NadeStats;
};

export type NadeCreateModel = {
  gfycat: GfycatData;
  images: NadeImages;
  steamId: string;
  user: UserLightModel;
  viewCount: number;
  favoriteCount: number;
};

export type NadeLightDTO = {
  id: string;
  status: NadeStatus;
  title?: string;
  gfycat: GfycatData;
  images: NadeImages;
  type?: NadeType;
  mapSite?: MapSite;
  tickrate?: Tickrate;
  createdAt: Date;
  viewCount: number;
  favoriteCount: number;
};

export type NadeCreateDTO = {
  gfycatIdOrUrl: string;
  imageBase64: string;
};

export type NadeStatusDTO = {
  status: NadeStatus;
  statusInfo?: StatusInfo;
};

export type NadeUpdateDTO = {
  title?: string;
  description?: string;
  gfycatIdOrUrl?: string;
  map?: CsgoMap;
  movement?: Movement;
  technique?: Technique;
  tickrate?: Tickrate;
  type?: NadeType;
  mapSite?: MapSite;
  createdAt?: string;
};

export type NadeGfycatValidateDTO = {
  gfycatIdOrUrl: string;
};

export const makeNadeFromBody = (
  user: UserLightModel,
  gfycatData: GfycatDetailsResponse,
  images: NadeImages
): NadeCreateModel => {
  return {
    gfycat: {
      gfyId: gfycatData.gfyItem.gfyId,
      smallVideoUrl: gfycatData.gfyItem.mobileUrl,
      largeVideoUrl: gfycatData.gfyItem.mp4Url
    },
    images,
    user,
    steamId: user.steamId,
    viewCount: gfycatData.gfyItem.views,
    favoriteCount: 0
  };
};

export function updatedNadeMerge(
  updateFields: NadeUpdateDTO,
  views?: number,
  newUser?: UserModel,
  newGfcatData?: GfycatData
): Partial<NadeModel> {
  const newNade: Partial<NadeModel> = {
    title: updateFields.title,
    description: updateFields.description,
    map: updateFields.map,
    movement: updateFields.movement,
    technique: updateFields.technique,
    tickrate: updateFields.tickrate,
    type: updateFields.type,
    gfycat: newGfcatData,
    user: newUser,
    steamId: newUser && newUser.steamId,
    mapSite: updateFields.mapSite,
    viewCount: views,
    createdAt: updateFields.createdAt && new Date(updateFields.createdAt)
  };

  return removeUndefines(newNade);
}
