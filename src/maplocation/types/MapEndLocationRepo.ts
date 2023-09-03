import { CsMap } from "../../nade/nadeSubTypes/CsgoMap";
import { GameMode } from "../../nade/nadeSubTypes/GameMode";
import { NadeType } from "../../nade/nadeSubTypes/NadeType";
import {
  AddMapEndLocation,
  EditMapEndLocation,
  MapEndLocation,
} from "./MapEndLocation";

export type MapEndLocationRepo = {
  getById: (id: string) => Promise<MapEndLocation | null>;
  getMapEndLocations: (
    map: CsMap,
    nadeType: NadeType,
    gameMode: GameMode
  ) => Promise<MapEndLocation[]>;
  save: (endLocation: AddMapEndLocation) => Promise<MapEndLocation | null>;
  edit: (endLocation: EditMapEndLocation) => Promise<MapEndLocation | null>;
  removeById: (id: string) => Promise<"success" | "failure">;
};
