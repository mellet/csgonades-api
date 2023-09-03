import { MapEndLocation } from "./MapEndLocation";
import { MapStartLocation } from "./MapStartLocation";

export type StartLocation = MapStartLocation & {
  count: number;
  hasNew?: boolean;
};

export type MapLocation = {
  endLocation: MapEndLocation & { count: number; hasNew?: boolean };
  startPositions: StartLocation[];
};
