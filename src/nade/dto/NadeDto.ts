import { ImageData } from "../../imageGallery/ImageStorageRepo";
import { UserLightModel } from "../../user/UserModel";
import { CsMap } from "../nadeSubTypes/CsgoMap";
import { GameMode } from "../nadeSubTypes/GameMode";
import { Movement } from "../nadeSubTypes/Movements";
import { NadeStatus } from "../nadeSubTypes/NadeStatus";
import { NadeType } from "../nadeSubTypes/NadeType";
import { TeamSide } from "../nadeSubTypes/TeamSide";
import { Technique } from "../nadeSubTypes/Technique";
import { Tickrate } from "../nadeSubTypes/Tickrate";
import { GfycatData } from "./GfycatData";
import { StatusInfo } from "./StatusInfo";

export type NadeImages = {
  result: {
    small: string;
    medium: string;
    large: string;
  };
  lineup: {
    small: string;
    medium: string;
    large: string;
  };
};

export type NadeDto = {
  commentCount: number;
  createdAt: Date;
  description: string;
  eloScore: number;
  endPosition?: string;
  favoriteCount: number;
  gameMode: GameMode;
  gfycat?: GfycatData | null;
  id: string;
  imageLineup?: ImageData;
  imageLineupThumb?: ImageData;
  imageMain: ImageData;
  imageMainThumb?: ImageData;
  images: NadeImages;
  isPro?: boolean;
  lastGfycatUpdate: Date;
  map: CsMap;
  mapEndLocationId: string;
  mapStartLocationId: string;
  movement: Movement;
  oneWay?: boolean;
  proUrl?: string;
  score: number;
  setPos?: string;
  slug?: string;
  startPosition: string;
  status: NadeStatus;
  statusInfo?: StatusInfo;
  steamId: string;
  teamSide: TeamSide;
  technique: Technique;
  tickrate?: Tickrate;
  type: NadeType;
  updatedAt: Date;
  user: UserLightModel;
  viewCount: number;
  youTubeId: string;
};
