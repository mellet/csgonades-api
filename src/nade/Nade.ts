import { GfycatDetailsResponse } from "gfycat-sdk";
import { UserLightModel, UserModel } from "../user/UserModel";
import { removeUndefines } from "../utils/Common";

type NadeImages = {
  thumbnailId: string;
  thumbnailUrl: string;
};

export type CsgoMap = "notset" | "dust2" | "mirage" | "nuke" | "inferno";

type Movement = "notset" | "stationary" | "running" | "walking" | "crouching";

export type NadeStatus = "pending" | "accepted" | "declined" | "deleted";

export type MapSite = "a" | "b" | "mid";

type StatusInfo = string;

export type GfycatData = {
  gfyId: string;
  smallVideoUrl: string;
  largeVideoUrl: string;
  largeVideoWebm?: string;
  avgColor?: string;
};

type Technique =
  | "notset"
  | "mouseleft"
  | "mouseright"
  | "mouseboth"
  | "jumpthrow";

type Tickrate = "64tick" | "128 tick" | "Any";

type NadeType = "notset" | "smoke" | "flash" | "molotov" | "hegrenade";

type MapCoordinates = {
  x: number;
  y: number;
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
  mapStartCoord?: MapCoordinates;
  mapEndCoord?: MapCoordinates;
  viewCount: number;
  favoriteCount: number;
}

export interface NadeDTO extends NadeModel {
  id: string;
  score: number;
}

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
  technique?: Technique;
  movement?: Movement;
  createdAt: Date;
  viewCount: number;
  favoriteCount: number;
  mapEndCoord?: MapCoordinates;
  score: number;
};

export type NadeCreateDTO = {
  gfycatIdOrUrl: string;
  imageBase64: string;
};

export type NadeUpdateResultImageDto = {
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
  mapStartCoord?: MapCoordinates;
  mapEndCoord?: MapCoordinates;
  images?: NadeImages;
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
      largeVideoUrl: gfycatData.gfyItem.mp4Url,
      largeVideoWebm: gfycatData.gfyItem.webmUrl,
      avgColor: gfycatData.gfyItem.avgColor
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
    mapEndCoord: updateFields.mapEndCoord,
    createdAt: updateFields.createdAt
      ? new Date(updateFields.createdAt)
      : undefined,
    images: updateFields.images
  };

  return removeUndefines(newNade);
}
