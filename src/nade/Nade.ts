import firebase from "firebase-admin";
import { CSGNUser } from "../user/User";
import { GfycatDetailsResponse } from "gfycat-sdk";

export type CsgoMap = "notset" | "dust2" | "mirage" | "nuke" | "inferno";

type Movement = "notset" | "stationary" | "running" | "walking" | "crouching";

type Status = "pending" | "accepted" | "declined" | "deleted";

type StatusInfo = string;

export type GfycatData = {
  gfyId: string;
  smallVideoUrl: string;
};

export type NadeImages = {
  thumbnail: string;
  large: string;
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

export type Nade = {
  id: string;
  title: string;
  description: string;
  gfycat: GfycatData;
  images: NadeImages;
  map: CsgoMap;
  stats: NadeStats;
  movement: Movement;
  technique: Technique;
  tickrate: Tickrate;
  type: NadeType;
  steamId: string;
  user: CSGNUser;
  createdAt: Date;
  updatedAt: Date;
  status: Status;
  statusInfo?: StatusInfo;
};

export type NadeBody = {
  gfycatIdOrUrl: string;
  imageBase64: string;
  title?: string;
  description?: string;
  map?: CsgoMap;
  movement?: Movement;
  technique?: Technique;
  tickrate?: Tickrate;
  type?: NadeType;
  steamId?: string;
};

export type NadeUpdateBody = {
  title?: string;
  description?: string;
  gfycatIdOrUrl?: string;
  map?: CsgoMap;
  movement?: Movement;
  technique?: Technique;
  tickrate?: Tickrate;
  type?: NadeType;
  steamId?: string;
  status?: Status;
  statusInfo?: StatusInfo;
};

export const prepareNadeForFirebase = (nade: Nade) => {
  return {
    ...nade,
    createAt: firebase.firestore.Timestamp.fromDate(nade.createdAt),
    updatedAt: firebase.firestore.Timestamp.fromDate(nade.updatedAt)
  };
};

export const convertNadeFromFirebase = (
  data: FirebaseFirestore.DocumentData
): Nade => {
  const nade = {
    ...data,
    createdAt: data.createAt.toDate(),
    updatedAt: data.updatedAt.toDate()
  } as Nade;
  return nade;
};

export const makeNadeFromBody = (
  nade: NadeBody,
  user: CSGNUser,
  gfycatData: GfycatDetailsResponse,
  images: NadeImages
): Nade => {
  const timeNow = new Date();
  return {
    id: "notset",
    title: nade.title || "",
    description: nade.description || "",
    map: nade.map || "notset",
    movement: nade.movement || "notset",
    technique: nade.technique || "notset",
    type: nade.type || "notset",
    stats: {
      views: gfycatData.gfyItem.views || 0,
      comments: 0,
      favorited: 0
    },
    tickrate: nade.tickrate || "Any",
    gfycat: {
      gfyId: gfycatData.gfyItem.gfyId,
      smallVideoUrl: gfycatData.gfyItem.mobileUrl
    },
    createdAt: timeNow,
    updatedAt: timeNow,
    images,
    user,
    steamId: user.steamID,
    status: "pending"
  };
};

export function updatedNadeMerge(
  updateFields: NadeUpdateBody,
  nade: Nade,
  newUser?: CSGNUser,
  newGfcatData?: GfycatData,
  newStats?: NadeStats
): Nade {
  const newNade: Nade = {
    ...nade,
    title: updateFields.title || nade.title,
    description: updateFields.description || nade.description,
    map: updateFields.map || nade.map,
    movement: updateFields.movement || nade.movement,
    technique: updateFields.technique || nade.technique,
    tickrate: updateFields.tickrate || nade.tickrate,
    type: updateFields.type || nade.type,
    status: updateFields.status || nade.status,
    statusInfo: updateFields.statusInfo || nade.statusInfo,
    updatedAt: new Date(),
    gfycat: newGfcatData || nade.gfycat,
    stats: newStats || nade.stats,
    user: newUser || nade.user,
    steamId: newUser ? newUser.steamID : nade.steamId
  };

  return newNade;
}
