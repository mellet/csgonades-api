import { CsgoMap, NadeModel, NadeCreateModel, NadeStats } from "./Nade";
import { AppResult } from "../utils/Common";
import { NadeFilter } from "./NadeFilter";
import { UserLightModel } from "../user/UserModel";

export interface NadeRepo {
  get(limit?: number): AppResult<NadeModel[]>;
  byID(steamID: string): AppResult<NadeModel>;
  listByIds(ids: string[]): AppResult<NadeModel[]>;
  getPending(): AppResult<NadeModel[]>;
  byMap(map: CsgoMap, nadeFilter: NadeFilter): AppResult<NadeModel[]>;
  byUser(steamId: string): AppResult<NadeModel[]>;
  save(nade: NadeCreateModel): AppResult<NadeModel>;
  update(nadeId: string, updates: Partial<NadeModel>): AppResult<NadeModel>;
  delete(nadeId: string): AppResult<boolean>;
  updateUserOnNades(steamId: string, user: UserLightModel): AppResult<boolean>;
  updateStats(nadeId: string, stats: Partial<NadeStats>): AppResult<NadeModel>;
}
