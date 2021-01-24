import { UserLightModel } from "../../user/UserModel";
import { NadeCreateModel, NadeDTO, NadeModel } from "../Nade";
import { CsgoMap } from "../nadeSubTypes/CsgoMap";

export interface NadeRepo {
  isSlugAvailable(slug: string): Promise<boolean>;
  getAll(nadeLimit?: number): Promise<NadeDTO[]>;
  getPending(): Promise<NadeDTO[]>;
  getDeclined(): Promise<NadeDTO[]>;
  getById(nadeId: string): Promise<NadeDTO>;
  getBySlug(slug: string): Promise<NadeDTO>;
  getByMap(csgoMap: CsgoMap): Promise<NadeDTO[]>;
  getByUser(steamId: string): Promise<NadeDTO[]>;
  save(nadeCreate: NadeCreateModel): Promise<NadeDTO>;
  update(
    nadeId: string,
    updates: Partial<NadeModel>,
    setNewUpdateNade?: boolean
  ): Promise<NadeDTO>;

  delete(nadeId: string): Promise<void>;
  updateUserOnNades(steamId: string, user: UserLightModel): Promise<void>;

  incrementFavoriteCount(nadeId: string): Promise<NadeDTO>;
  decrementFavoriteCount(nadeId: string): Promise<NadeDTO>;
  incrementCommentCount(nadeId: string): Promise<NadeDTO>;
  decrementCommentCount(nadeId: string): Promise<NadeDTO>;
}
