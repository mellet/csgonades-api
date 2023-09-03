import { MapCoordinates } from "../../nade/dto/MapCoordinates";
import { CsMap } from "../../nade/nadeSubTypes/CsgoMap";
import { GameMode } from "../../nade/nadeSubTypes/GameMode";
import { NadeType } from "../../nade/nadeSubTypes/NadeType";

export type MapEndLocationDocData = {
  calloutName: string;
  map: CsMap;
  type: NadeType;
  position: MapCoordinates;
  gameMode: GameMode;
};

export type MapEndLocation = {
  id: string;
  calloutName: string;
  map: CsMap;
  position: MapCoordinates;
  type: NadeType;
  gameMode: GameMode;
};

export type AddMapEndLocation = {
  calloutName: string;
  map: CsMap;
  position: MapCoordinates;
  type: NadeType;
  gameMode: GameMode;
};

export type EditMapEndLocation = {
  id: string;
  calloutName?: string;
  position?: MapCoordinates;
  map?: CsMap;
  type?: NadeType;
  gameMode?: GameMode;
};
