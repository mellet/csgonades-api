import { CsgoMap } from "../nadeSubTypes/CsgoMap";
import { Movement } from "../nadeSubTypes/Movements";
import { NadeStatus } from "../nadeSubTypes/NadeStatus";
import { NadeType } from "../nadeSubTypes/NadeType";
import { Technique } from "../nadeSubTypes/Technique";
import { Tickrate } from "../nadeSubTypes/Tickrate";
import { GfycatData } from "./GfycatData";
import { MapCoordinates } from "./MapCoordinates";

export type NadeUpdateDto = {
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
