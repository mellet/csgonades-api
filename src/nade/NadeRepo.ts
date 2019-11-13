import { Nade, CsgoMap } from "./Nade";

export interface NadeRepo {
  get(limit?: number): Promise<Nade[]>;
  byID(steamID: string): Promise<Nade>;
  byMap(map: CsgoMap): Promise<Nade[]>;
  save(user: Nade): Promise<Nade>;
}
