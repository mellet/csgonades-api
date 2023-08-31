import { CsMap } from "../nadeSubTypes/CsgoMap";
import { GameMode } from "../nadeSubTypes/GameMode";
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
  gameMode?: GameMode;
  gfycat: GfycatData;
  imageBase64: string;
  lineUpImageBase64: string;
  map: CsMap;
  mapEndCoord: MapCoordinates;
  mapStartCoord?: MapCoordinates;
  mapStartLocationId?: string;
  mapEndLocationId?: string;
  movement: Movement;
  oneWay?: boolean;
  proUrl?: string;
  setPos?: string;
  startPosition: string;
  teamSide: TeamSide;
  technique: Technique;
  tickrate?: Tickrate;
  type: NadeType;
  youTubeId: string;
};

export type NadeEloGame = {
  nadeOneId: string;
  nadeTwoId: string;
  winnerId: string;
};
