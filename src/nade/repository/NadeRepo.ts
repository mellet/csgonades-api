import { UserLightModel } from "../../user/UserModel";
import { NadeCreateModel } from "../dto/NadeCreateModel";
import { NadeDto } from "../dto/NadeDto";
import { NadeFireModel } from "../dto/NadeFireModel";
import { CsMap } from "../nadeSubTypes/CsgoMap";
import { GameMode } from "../nadeSubTypes/GameMode";
import { NadeType } from "../nadeSubTypes/NadeType";

export type NadeUpdateConfig = {
  setNewUpdatedAt?: boolean;
  setNewCreatedAt?: boolean;
  invalidateCache?: boolean;
};

export interface NadeRepo {
  isSlugAvailable(slug: string): Promise<boolean>;
  getRecent(gameMode?: GameMode): Promise<NadeDto[]>;
  getPending(): Promise<NadeDto[]>;
  getDeclined(): Promise<NadeDto[]>;
  getDeleted(): Promise<NadeDto[]>;
  getDeletedToRemove(): Promise<NadeDto[]>;
  getById(nadeId: string): Promise<NadeDto | null>;
  getBySlug(slug: string): Promise<NadeDto | null>;
  getListOfNades(nadeIds: string[]): Promise<NadeDto[]>;
  getByStartAndEndLocation(
    startLocationId: string,
    endLocationId: string
  ): Promise<NadeDto[]>;
  getByMap(
    csgoMap: CsMap,
    nadeType?: NadeType,
    gameMode?: GameMode
  ): Promise<NadeDto[]>;
  getByUser(
    steamId: string,
    csgoMap?: CsMap,
    gameMode?: GameMode
  ): Promise<NadeDto[]>;
  save(nadeCreate: NadeCreateModel): Promise<NadeDto>;
  updateNade(
    nadeId: string,
    updates: Partial<NadeFireModel>,
    config?: NadeUpdateConfig
  ): Promise<NadeDto>;

  delete(nadeId: string): Promise<void>;
  updateUserOnNades(steamId: string, user: UserLightModel): Promise<void>;

  incrementFavoriteCount(nadeId: string): Promise<NadeDto>;
  decrementFavoriteCount(nadeId: string): Promise<NadeDto>;
  incrementCommentCount(nadeId: string): Promise<NadeDto>;
  decrementCommentCount(nadeId: string): Promise<NadeDto>;
}
