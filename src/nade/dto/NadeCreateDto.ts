import { CsMap } from "../nadeSubTypes/CsgoMap";
import { GameMode } from "../nadeSubTypes/GameMode";
import { Movement } from "../nadeSubTypes/Movements";
import { NadeType } from "../nadeSubTypes/NadeType";
import { TeamSide } from "../nadeSubTypes/TeamSide";
import { Technique } from "../nadeSubTypes/Technique";
import { Tickrate } from "../nadeSubTypes/Tickrate";

export type NadeCreateDto = {
  description: string;
  gameMode?: GameMode;
  imageBase64: string;
  lineUpImageBase64: string;
  map: CsMap;
  mapStartLocationId: string;
  mapEndLocationId: string;
  movement: Movement;
  oneWay?: boolean;
  proUrl?: string;
  setPos?: string;
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
