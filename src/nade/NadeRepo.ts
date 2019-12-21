import { CsgoMap, NadeModel, NadeCreateModel } from "./Nade";
import { Result } from "neverthrow";
import { AppResult } from "../utils/Common";

export interface NadeRepo {
  get(limit?: number): AppResult<NadeModel[]>;
  byID(steamID: string): AppResult<NadeModel>;
  byMap(map: CsgoMap): AppResult<NadeModel[]>;
  save(nade: NadeCreateModel): AppResult<NadeModel>;
  update(nadeId: string, updates: Partial<NadeModel>): AppResult<NadeModel>;
}
