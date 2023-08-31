import { MapEndLocation } from "./MapEndLocation";
import { MapStartLocation } from "./MapStartLocation";

export type StartLocation = MapStartLocation & {
  count: number;
};

export type MapLocation = {
  endLocation: MapEndLocation & { count: number };
  startPositions: StartLocation[];
};
