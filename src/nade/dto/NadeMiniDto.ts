import { UserLightModel } from "../../user/UserModel";
import { Movement } from "../nadeSubTypes/Movements";
import { NadeStatus } from "../nadeSubTypes/NadeStatus";
import { NadeType } from "../nadeSubTypes/NadeType";
import { Technique } from "../nadeSubTypes/Technique";
import { Tickrate } from "../nadeSubTypes/Tickrate";
import { GfycatData } from "./GfycatData";
import { MapCoordinates } from "./MapCoordinates";
import { NadeImages } from "./NadeImages";

export type NadeMiniDto = {
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
