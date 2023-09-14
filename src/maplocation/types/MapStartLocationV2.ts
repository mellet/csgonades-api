import { MapCoordinates } from "../../nade/dto/MapCoordinates";
import { CsMap } from "../../nade/nadeSubTypes/CsgoMap";
import { GameMode } from "../../nade/nadeSubTypes/GameMode";

export type MapStartLocationDocDataV2 = {
  calloutName: string;
  map: CsMap;
  position: MapCoordinates;
  gameMode: GameMode;
  enabled: boolean;
};

export type MapStartLocationV2 = {
  id: string;
  calloutName: string;
  position?: MapCoordinates;
  map: CsMap;
  gameMode: GameMode;
  enabled: boolean;
};

export type AddMapStartLocationV2 = {
  calloutName: string;
  map: CsMap;
  position: MapCoordinates;
  gameMode: GameMode;
};

export type EditMapStartLocationV2 = {
  id: string;
  calloutName?: string;
  position?: MapCoordinates;
  map?: CsMap;
  gameMode?: GameMode;
  enabled?: boolean;
};
