import { GameMode } from "../../nade/nadeSubTypes/GameMode";
import { NadeType } from "../../nade/nadeSubTypes/NadeType";
import { SiteStats } from "../SiteStats";

export interface StatsRepo {
  getClientConfig: () => Promise<SiteStats | null>;
  getStats: () => Promise<SiteStats | null>;
  incrementUserCounter: () => Promise<void>;
  incrementNadeCounter: (
    nadeType: NadeType,
    gameMode: GameMode
  ) => Promise<void>;
  decrementNadeCounter: (
    nadeType: NadeType,
    gameMode: GameMode
  ) => Promise<void>;
  setNadeCount: (
    numSmokes: number,
    numFlashes: number,
    numMolotovs: number,
    numGrenades: number
  ) => Promise<void>;
  setCs2NadeCount: (
    numSmokes: number,
    numFlashes: number,
    numMolotovs: number,
    numGrenades: number
  ) => Promise<void>;
}
