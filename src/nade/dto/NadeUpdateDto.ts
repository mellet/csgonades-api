import { CsgoMap } from "../nadeSubTypes/CsgoMap";
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
  gfycat?: GfycatData;
  imageBase64?: string;
  isPro?: boolean;
  lineUpImageBase64?: string;
  map?: CsgoMap;
  mapEndCoord?: MapCoordinates;
  movement?: Movement;
  oneWay?: boolean;
  setPos?: string;
  slug?: string;
  startPosition?: string;
  status?: NadeStatus;
  teamSide?: TeamSide;
  technique?: Technique;
  tickrate?: Tickrate;
  type?: NadeType;
};
