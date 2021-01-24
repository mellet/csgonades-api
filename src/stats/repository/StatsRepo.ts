import { SiteStats } from "../SiteStats";

export interface StatsRepo {
  getClientConfig: () => Promise<SiteStats | null>;
  getStats: () => Promise<SiteStats | null>;
  incrementUserCounter: () => Promise<void>;
  incrementNadeCounter: () => Promise<void>;
  decrementNadeCounter: () => Promise<void>;
}
