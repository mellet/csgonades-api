import { CsMap } from "../../nade/nadeSubTypes/CsgoMap";
import {
  AddMapStartLocation,
  EditMapStartLocation,
  MapStartLocation,
} from "./MapStartLocation";

export type MapStartLocationRepo = {
  getNadeStartLocations: (map: CsMap) => Promise<MapStartLocation[]>;
  addNadeStartLocation: (
    startLocation: AddMapStartLocation
  ) => Promise<MapStartLocation | null>;
  editNadeStartLocation: (
    startLocationUpdate: EditMapStartLocation
  ) => Promise<MapStartLocation | null>;
  deleteNadeStartLocation: (id: string) => Promise<"success" | "failure">;
};
