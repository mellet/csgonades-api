import { CsMap } from "../../nade/nadeSubTypes/CsgoMap";
import { NadeType } from "../../nade/nadeSubTypes/NadeType";
import {
  AddMapEndLocation,
  EditMapEndLocation,
  MapEndLocation,
} from "./MapEndLocation";

export type MapEndLocationRepo = {
  getMapEndLocations: (
    map: CsMap,
    nadeType: NadeType
  ) => Promise<MapEndLocation[]>;
  save: (endLocation: AddMapEndLocation) => Promise<MapEndLocation | null>;
  edit: (endLocation: EditMapEndLocation) => Promise<MapEndLocation | null>;
  removeById: (id: string) => Promise<"success" | "failure">;
};
