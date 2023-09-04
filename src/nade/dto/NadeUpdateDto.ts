import { CsMap } from "../nadeSubTypes/CsgoMap";
import { GameMode } from "../nadeSubTypes/GameMode";
import { Movement } from "../nadeSubTypes/Movements";
import { NadeStatus } from "../nadeSubTypes/NadeStatus";
import { NadeType } from "../nadeSubTypes/NadeType";
import { TeamSide } from "../nadeSubTypes/TeamSide";
import { Technique } from "../nadeSubTypes/Technique";
import { Tickrate } from "../nadeSubTypes/Tickrate";
import { GfycatData } from "./GfycatData";
import { MapCoordinates } from "./MapCoordinates";

export type NadeUpdateDto = {
  description?: string;
  endPosition?: string;
  gameMode?: GameMode;
  gfycat?: GfycatData;
  imageBase64?: string;
  isPro?: boolean;
  lineUpImageBase64?: string;
  map?: CsMap;
  mapEndCoord?: MapCoordinates;
  mapStartCoord?: MapCoordinates;
  mapStartLocationId?: string;
  mapEndLocationId?: string;
  movement?: Movement;
  oneWay?: boolean;
  proUrl?: string;
  setPos?: string;
  slug?: string;
  startPosition?: string;
  status?: NadeStatus;
  teamSide?: TeamSide;
  technique?: Technique;
  tickrate?: Tickrate;
  type?: NadeType;
  youTubeId?: string;
};
