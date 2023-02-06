import { CsgoMap } from "../nadeSubTypes/CsgoMap";
import { Movement } from "../nadeSubTypes/Movements";
import { NadeType } from "../nadeSubTypes/NadeType";
import { TeamSide } from "../nadeSubTypes/TeamSide";
import { Technique } from "../nadeSubTypes/Technique";
import { Tickrate } from "../nadeSubTypes/Tickrate";
import { GfycatData } from "./GfycatData";
import { MapCoordinates } from "./MapCoordinates";

export type NadeCreateDto = {
  description: string;
  endPosition: string;
  gfycat: GfycatData;
  imageBase64: string;
  lineUpImageBase64: string;
  map: CsgoMap;
  mapEndCoord: MapCoordinates;
  movement: Movement;
  oneWay?: boolean;
  proUrl?: string;
  setPos?: string;
  startPosition: string;
  teamSide: TeamSide;
  technique: Technique;
  tickrate?: Tickrate;
  type: NadeType;
};
