import { MapEndLocation } from "./MapEndLocation";
import { MapStartLocationV2 } from "./MapStartLocationV2";

export type StartLocation = MapStartLocationV2 & {
  count: number;
  hasNew?: boolean;
};

export type MapLocation = {
  endLocation: MapEndLocation & { count: number; hasNew?: boolean };
  startPositions: StartLocation[];
};
