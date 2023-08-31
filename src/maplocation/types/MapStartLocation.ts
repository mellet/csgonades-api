import { MapCoordinates } from "../../nade/dto/MapCoordinates";
import { CsMap } from "../../nade/nadeSubTypes/CsgoMap";

export type MapStartLocationDocData = {
  calloutName: string;
  map: CsMap;
  position: MapCoordinates[];
  labelPosition?: MapCoordinates;
};

export type MapStartLocation = {
  id: string;
  calloutName: string;
  labelPosition?: MapCoordinates;
  map: CsMap;
  position: MapCoordinates[];
};

export type AddMapStartLocation = {
  calloutName: string;
  map: CsMap;
  position: MapCoordinates[];
  labelPosition?: MapCoordinates;
};

export type EditMapStartLocation = {
  id: string;
  calloutName?: string;
  position?: MapCoordinates[];
  map?: CsMap;
  labelPosition?: MapCoordinates;
};
