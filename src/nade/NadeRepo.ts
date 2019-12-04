import { CsgoMap, Nade } from "./Nade";

export interface NadeRepo {
  get(limit?: number): Promise<Nade[]>;
  byID(steamID: string): Promise<Nade>;
  byMap(map: CsgoMap): Promise<Nade[]>;
  save(nade: Nade): Promise<Nade>;
  update(nade: Nade): Promise<Nade>;
}
