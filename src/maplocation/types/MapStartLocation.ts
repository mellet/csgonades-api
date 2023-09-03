import { MapCoordinates } from "../../nade/dto/MapCoordinates";
import { CsMap } from "../../nade/nadeSubTypes/CsgoMap";
import { GameMode } from "../../nade/nadeSubTypes/GameMode";

export type MapStartLocationDocData = {
  calloutName: string;
  map: CsMap;
  position: MapCoordinates[];
  labelPosition?: MapCoordinates;
  gameMode: GameMode;
};

export type MapStartLocation = {
  id: string;
  calloutName: string;
  labelPosition?: MapCoordinates;
  map: CsMap;
  position: MapCoordinates[];
  gameMode: GameMode;
};

export type AddMapStartLocation = {
  calloutName: string;
  map: CsMap;
  position: MapCoordinates[];
  labelPosition?: MapCoordinates;
  gameMode: GameMode;
};

export type EditMapStartLocation = {
  id: string;
  calloutName?: string;
  position?: MapCoordinates[];
  map?: CsMap;
  labelPosition?: MapCoordinates;
  gameMode?: GameMode;
};
