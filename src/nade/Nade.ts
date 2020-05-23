import { UserLightModel } from "../user/UserModel";
import { removeUndefines } from "../utils/Common";
import { CsgoMap } from "./nadeSubTypes/CsgoMap";
import { Movement } from "./nadeSubTypes/Movements";
import { NadeStatus } from "./nadeSubTypes/NadeStatus";
import { NadeType } from "./nadeSubTypes/NadeType";
import { Technique } from "./nadeSubTypes/Technique";
import { Tickrate } from "./nadeSubTypes/Tickrate";

export type NadeImages = {
  // Result image
  thumbnailId: string;
  thumbnailCollection?: string;
  thumbnailUrl: string;
  // Line up image
  lineupId?: string;
  lineupUrl?: string;
};

type StatusInfo = string;

export type GfycatData = {
  gfyId: string;
  smallVideoUrl: string;
  largeVideoUrl: string;
  largeVideoWebm?: string;
  avgColor?: string;
  duration?: string;
};

type MapCoordinates = {
  x: number;
  y: number;
};

export interface NadeModel {
  title?: string;
  startPosition?: string;
  endPosition?: string;
  slug?: string;
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
  mapStartCoord?: MapCoordinates;
  mapEndCoord?: MapCoordinates;
  viewCount: number;
  favoriteCount: number;
  commentCount: number;
  upVoteCount?: number;
  downVoteCount?: number;
  oneWay?: boolean;
  isPro?: boolean;
}

export interface NadeDTO extends NadeModel {
  id: string;
  score: number;
  nextUpdateInHours: number;
}

export type NadeCreateModel = {
  gfycat: GfycatData;
  images: NadeImages;
  steamId: string;
  user: UserLightModel;
  viewCount: number;
  favoriteCount: number;
  commentCount: number;
  description: string;
  endPosition: string;
  startPosition: string;
  map: CsgoMap;
  mapEndCoord: MapCoordinates;
  movement: Movement;
  technique: Technique;
  tickrate?: Tickrate;
  type: NadeType;
  oneWay?: boolean;
};

export type NadeLightDTO = {
  id: string;
  status: NadeStatus;
  title?: string;
  startPosition?: string;
  endPosition?: string;
  slug?: string;
  gfycat: GfycatData;
  images: NadeImages;
  type?: NadeType;
  tickrate?: Tickrate;
  technique?: Technique;
  movement?: Movement;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  commentCount: number;
  favoriteCount: number;
  mapEndCoord?: MapCoordinates;
  score: number;
  user: UserLightModel;
  nextUpdateInHours: number;
  oneWay?: boolean;
  isPro?: boolean;
  upVoteCount?: number;
  downVoteCount?: number;
};

export type NadeCreateDTO = {
  gfycat: GfycatData;
  imageBase64: string;
  lineUpImageBase64?: string;
  startPosition: string;
  endPosition: string;
  description: string;
  map: CsgoMap;
  movement: Movement;
  technique: Technique;
  tickrate?: Tickrate;
  type: NadeType;
  mapEndCoord: MapCoordinates;
  oneWay?: boolean;
};

export type NadeUpdateDTO = {
  gfycat?: GfycatData;
  imageBase64?: string;
  lineUpImageBase64?: string;
  startPosition?: string;
  endPosition?: string;
  description?: string;
  map?: CsgoMap;
  movement?: Movement;
  technique?: Technique;
  tickrate?: Tickrate;
  type?: NadeType;
  mapEndCoord?: MapCoordinates;
  status?: NadeStatus;
  slug?: string;
  oneWay?: boolean;
  isPro?: boolean;
};

export type NadeGfycatValidateDTO = {
  gfycatIdOrUrl: string;
};

export function updatedNadeMerge(
  updateFields: NadeUpdateDTO,
  newImages?: NadeImages
): Partial<NadeModel> {
  const newNade: Partial<NadeModel> = {
    endPosition: updateFields.endPosition,
    slug: updateFields.slug,
    startPosition: updateFields.startPosition,
    status: updateFields.status,
    description: updateFields.description,
    map: updateFields.map,
    movement: updateFields.movement,
    technique: updateFields.technique,
    tickrate: updateFields.tickrate,
    type: updateFields.type,
    gfycat: updateFields.gfycat,
    mapEndCoord: updateFields.mapEndCoord,
    images: newImages,
    oneWay: updateFields.oneWay,
    isPro: updateFields.isPro,
  };

  return removeUndefines(newNade);
}
