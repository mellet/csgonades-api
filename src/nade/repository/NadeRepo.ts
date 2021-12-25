import { UserLightModel } from "../../user/UserModel";
import { NadeCreateModel } from "../dto/NadeCreateModel";
import { NadeDto } from "../dto/NadeDto";
import { NadeFireModel } from "../dto/NadeFireModel";
import { CsgoMap } from "../nadeSubTypes/CsgoMap";
import { NadeType } from "../nadeSubTypes/NadeType";

export interface NadeRepo {
  isSlugAvailable(slug: string): Promise<boolean>;
  getAll(nadeLimit?: number): Promise<NadeDto[]>;
  getPending(): Promise<NadeDto[]>;
  getDeclined(): Promise<NadeDto[]>;
  getDeleted(): Promise<NadeDto[]>;
  getById(nadeId: string): Promise<NadeDto | null>;
  getBySlug(slug: string): Promise<NadeDto | null>;
  getByMap(csgoMap: CsgoMap, nadeType?: NadeType): Promise<NadeDto[]>;
  getByUser(steamId: string, csgoMap?: CsgoMap): Promise<NadeDto[]>;
  save(nadeCreate: NadeCreateModel): Promise<NadeDto>;
  updateNade(
    nadeId: string,
    updates: Partial<NadeFireModel>,
    setNewUpdateNade?: boolean,
    setNewCreatedAt?: boolean
  ): Promise<NadeDto>;

  delete(nadeId: string): Promise<void>;
  updateUserOnNades(steamId: string, user: UserLightModel): Promise<void>;

  incrementFavoriteCount(nadeId: string): Promise<NadeDto>;
  decrementFavoriteCount(nadeId: string): Promise<NadeDto>;
  incrementCommentCount(nadeId: string): Promise<NadeDto>;
  decrementCommentCount(nadeId: string): Promise<NadeDto>;
}
