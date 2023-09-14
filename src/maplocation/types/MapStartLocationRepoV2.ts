import { CsMap } from "../../nade/nadeSubTypes/CsgoMap";
import { GameMode } from "../../nade/nadeSubTypes/GameMode";
import {} from "./MapStartLocation";
import {
  AddMapStartLocationV2,
  EditMapStartLocationV2,
  MapStartLocationV2,
} from "./MapStartLocationV2";

export type MapStartLocationRepoV2 = {
  getById: (id: string) => Promise<MapStartLocationV2 | null>;
  getNadeStartLocations: (
    map: CsMap,
    gameMode: GameMode
  ) => Promise<MapStartLocationV2[]>;
  addNadeStartLocation: (
    startLocation: AddMapStartLocationV2
  ) => Promise<MapStartLocationV2 | null>;
  editNadeStartLocation: (
    startLocationUpdate: EditMapStartLocationV2
  ) => Promise<MapStartLocationV2 | null>;
  deleteNadeStartLocation: (id: string) => Promise<"success" | "failure">;
};
