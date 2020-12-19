import { ImageRes } from "../imageGallery/ImageStorageService";
import { UserLightModel } from "../user/UserModel";
import { removeUndefines } from "../utils/Common";
import { CsgoMap } from "./nadeSubTypes/CsgoMap";
import { Movement } from "./nadeSubTypes/Movements";
import { NadeStatus } from "./nadeSubTypes/NadeStatus";
import { NadeType } from "./nadeSubTypes/NadeType";
import { Technique } from "./nadeSubTypes/Technique";
import { Tickrate } from "./nadeSubTypes/Tickrate";

export type NadeImages = {
  lineupId?: string;
  lineupUrl?: string;
  thumbnailCollection?: string;
  thumbnailId: string;
  thumbnailUrl: string;
};

type StatusInfo = string;

export type GfycatData = {
  avgColor?: string;
  duration?: string;
  gfyId: string;
  largeVideoUrl: string;
  largeVideoWebm?: string;
  smallVideoUrl: string;
};

type MapCoordinates = {
  x: number;
  y: number;
};

export interface NadeModel {
  commentCount: number;
  createdAt: Date;
  description?: string;
  downVoteCount?: number;
  endPosition?: string;
  favoriteCount: number;
  gfycat: GfycatData;
  images: NadeImages;

  imageLineupThumb?: ImageRes;
  isPro?: boolean;
  lastGfycatUpdate: Date;
  map?: CsgoMap;
  mapEndCoord?: MapCoordinates;
  mapStartCoord?: MapCoordinates;
  movement?: Movement;
  oneWay?: boolean;
  slug?: string;
  startPosition?: string;
  status: NadeStatus;
  statusInfo?: StatusInfo;
  steamId: string;
  technique?: Technique;
  tickrate?: Tickrate;
  title?: string;
  type?: NadeType;
  updatedAt: Date;
  upVoteCount?: number;
  user: UserLightModel;
  viewCount: number;
}

export interface NadeDTO extends NadeModel {
  id: string;
  nextUpdateInHours: number;
  score: number;
}

export type NadeCreateModel = {
  commentCount: number;
  description: string;
  endPosition: string;
  favoriteCount: number;
  gfycat: GfycatData;
  imageLineupThumb?: ImageRes;
  images: NadeImages;
  map: CsgoMap;
  mapEndCoord: MapCoordinates;
  movement: Movement;
  oneWay?: boolean;
  startPosition: string;
  steamId: string;
  technique: Technique;
  tickrate?: Tickrate;
  type: NadeType;
  user: UserLightModel;
  viewCount: number;
};

export type NadeLightDTO = {
  id: string;
  commentCount: number;
  createdAt: Date;
  downVoteCount?: number;
  endPosition?: string;
  favoriteCount: number;
  gfycat: GfycatData;
  imageLineupThumbUrl?: string;
  images: NadeImages;
  isPro?: boolean;
  mapEndCoord?: MapCoordinates;
  movement?: Movement;
  nextUpdateInHours: number;
  oneWay?: boolean;
  score: number;
  slug?: string;
  startPosition?: string;
  status: NadeStatus;
  technique?: Technique;
  tickrate?: Tickrate;
  title?: string;
  type?: NadeType;
  updatedAt: Date;
  upVoteCount?: number;
  user: UserLightModel;
  viewCount: number;
};

export type NadeCreateDTO = {
  description: string;
  endPosition: string;
  gfycat: GfycatData;
  imageBase64: string;
  lineUpImageBase64?: string;
  map: CsgoMap;
  mapEndCoord: MapCoordinates;
  movement: Movement;
  oneWay?: boolean;
  startPosition: string;
  technique: Technique;
  tickrate?: Tickrate;
  type: NadeType;
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
  newImages?: NadeImages,
  newLineUpThumb?: ImageRes
): Partial<NadeModel> {
  const newNade: Partial<NadeModel> = {
    description: updateFields.description,
    endPosition: updateFields.endPosition,
    gfycat: updateFields.gfycat,
    imageLineupThumb: newLineUpThumb,
    images: newImages,
    isPro: updateFields.isPro,
    map: updateFields.map,
    mapEndCoord: updateFields.mapEndCoord,
    movement: updateFields.movement,
    oneWay: updateFields.oneWay,
    slug: updateFields.slug,
    startPosition: updateFields.startPosition,
    status: updateFields.status,
    technique: updateFields.technique,
    tickrate: updateFields.tickrate,
    type: updateFields.type,
  };

  return removeUndefines(newNade);
}
