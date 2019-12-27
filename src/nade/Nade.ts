import firebase from "firebase-admin";
import { GfycatDetailsResponse } from "gfycat-sdk";
import { UserLightModel, UserModel } from "../user/UserModel";
import { removeUndefines } from "../utils/Common";
import { NadeImages } from "../services/ImageStorageService";

export type CsgoMap = "notset" | "dust2" | "mirage" | "nuke" | "inferno";

type Movement = "notset" | "stationary" | "running" | "walking" | "crouching";

export type NadeStatus = "pending" | "accepted" | "declined" | "deleted";

type StatusInfo = string;

export type GfycatData = {
  gfyId: string;
  smallVideoUrl: string;
};

type Technique =
  | "notset"
  | "mouseleft"
  | "mouseright"
  | "mouseboth"
  | "jumpthrow";

type Tickrate = "64tick" | "128 tick" | "Any";

type NadeType = "notset" | "smoke" | "flash" | "molotov" | "he-grenade";

export type NadeStats = {
  comments: number;
  favorited: number;
  views: number;
};

export type NadeModel = {
  id: string;
  title?: string;
  gfycat: GfycatData;
  images: NadeImages;
  steamId: string;
  user: UserLightModel;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  lastGfycatUpdate: FirebaseFirestore.Timestamp;
  status: NadeStatus;
  description?: string;
  map?: CsgoMap;
  stats: NadeStats;
  movement?: Movement;
  technique?: Technique;
  tickrate?: Tickrate;
  type?: NadeType;
  statusInfo?: StatusInfo;
};

export type NadeCreateModel = {
  gfycat: GfycatData;
  images: NadeImages;
  steamId: string;
  user: UserLightModel;
  stats: NadeStats;
};

export type NadeDTO = {
  id: string;
  title: string;
  description?: string;
  gfycat: GfycatData;
  images: NadeImages;
  map?: CsgoMap;
  stats: NadeStats;
  movement?: Movement;
  technique?: Technique;
  tickrate?: Tickrate;
  type?: NadeType;
  steamId: string;
  user: UserLightModel;
  createdAt: Date;
  updatedAt: Date;
  status: NadeStatus;
  statusInfo?: StatusInfo;
};

export type NadeLightDTO = {
  id: string;
  title?: string;
  gfycat: GfycatData;
  images: NadeImages;
  stats: NadeStats;
  type?: NadeType;
  tickrate?: Tickrate;
  createdAt: Date;
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
};

export const makeNadeFromBody = (
  user: UserLightModel,
  gfycatData: GfycatDetailsResponse,
  images: NadeImages
): NadeCreateModel => {
  return {
    stats: {
      views: gfycatData.gfyItem.views || 0,
      comments: 0,
      favorited: 0
    },
    gfycat: {
      gfyId: gfycatData.gfyItem.gfyId,
      smallVideoUrl: gfycatData.gfyItem.mobileUrl
    },
    images,
    user,
    steamId: user.steamId
  };
};

export function updatedNadeMerge(
  updateFields: NadeUpdateDTO,
  nade: NadeModel,
  newUser?: UserModel,
  newGfcatData?: GfycatData,
  newStats?: NadeStats
): NadeModel {
  const newNade: NadeModel = {
    ...nade,
    title: updateFields.title || nade.title,
    description: updateFields.description || nade.description,
    map: updateFields.map || nade.map,
    movement: updateFields.movement || nade.movement,
    technique: updateFields.technique || nade.technique,
    tickrate: updateFields.tickrate || nade.tickrate,
    type: updateFields.type || nade.type,
    gfycat: newGfcatData || nade.gfycat,
    stats: newStats || nade.stats,
    user: newUser || nade.user,
    steamId: newUser ? newUser.steamId : nade.steamId
  };

  return removeUndefines(newNade);
}
