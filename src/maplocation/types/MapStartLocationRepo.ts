import { CsMap } from "../../nade/nadeSubTypes/CsgoMap";
import { GameMode } from "../../nade/nadeSubTypes/GameMode";
import {
  AddMapStartLocation,
  EditMapStartLocation,
  MapStartLocation,
} from "./MapStartLocation";

export type MapStartLocationRepo = {
  getById: (id: string) => Promise<MapStartLocation | null>;
  getNadeStartLocations: (
    map: CsMap,
    gameMode: GameMode
  ) => Promise<MapStartLocation[]>;
  addNadeStartLocation: (
    startLocation: AddMapStartLocation
  ) => Promise<MapStartLocation | null>;
  editNadeStartLocation: (
    startLocationUpdate: EditMapStartLocation
  ) => Promise<MapStartLocation | null>;
  deleteNadeStartLocation: (id: string) => Promise<"success" | "failure">;
};
