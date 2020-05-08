import { UserLightModel } from "../user/UserModel";
import { removeUndefines } from "../utils/Common";

export type NadeImages = {
  thumbnailId: string;
  thumbnailCollection?: string;
  thumbnailUrl: string;
};

export type CsgoMap =
  | "notset"
  | "dust2"
  | "mirage"
  | "nuke"
  | "inferno"
  | "anubis"
  | "overpass"
  | "cobblestone";

type Movement =
  | "notset"
  | "stationary"
  | "running"
  | "walking"
  | "crouching"
  | "crouchwalking";

export type NadeStatus = "pending" | "accepted" | "declined" | "deleted";

export type MapSite = "a" | "b" | "mid";

type StatusInfo = string;

export type GfycatData = {
  gfyId: string;
  smallVideoUrl: string;
  largeVideoUrl: string;
  largeVideoWebm?: string;
  avgColor?: string;
  duration?: string;
};

type Technique =
  | "notset"
  | "mouseleft"
  | "mouseright"
  | "mouseboth"
  | "jumpthrow";

type Tickrate = "tick64" | "tick128" | "any";

type NadeType = "notset" | "smoke" | "flash" | "molotov" | "hegrenade";

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
  mapSite?: MapSite;
  mapStartCoord?: MapCoordinates;
  mapEndCoord?: MapCoordinates;
  viewCount: number;
  favoriteCount: number;
  commentCount: number;
  youtubeId?: string;
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
  mapSite?: MapSite;
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
};

export type NadeCreateDTO = {
  gfycat: GfycatData;
  imageBase64: string;
  startPosition: string;
  endPosition: string;
  description: string;
  map: CsgoMap;
  movement: Movement;
  technique: Technique;
  tickrate?: Tickrate;
  type: NadeType;
  mapEndCoord: MapCoordinates;
};

export type NadeUpdateResultImageDto = {
  imageBase64: string;
};

export type NadeStatusDTO = {
  status: NadeStatus;
  statusInfo?: StatusInfo;
};

export type NadeUpdateDTO = {
  gfycat?: GfycatData;
  imageBase64?: string;
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
};

export type NadeGfycatValidateDTO = {
  gfycatIdOrUrl: string;
};

export function updatedNadeMerge(
  updateFields: NadeUpdateDTO,
  newResultImage?: NadeImages
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
    images: newResultImage,
  };

  return removeUndefines(newNade);
}
