import { StatsRepo } from "./StatsRepo";
import { AppResult } from "../utils/Common";
import { SiteStats } from "./SiteStats";

export class StatsService {
  private statsRepo: StatsRepo;

  constructor(statsRepo: StatsRepo) {
    this.statsRepo = statsRepo;
  }

  getStats(): AppResult<SiteStats> {
    return this.statsRepo.getStats();
  }

  incrementUserCounter() {
    return this.statsRepo.incrementUserCounter();
  }

  incrementNadeCounter() {
    return this.statsRepo.incrementNadeCounter();
  }

  decrementNadeCounter() {
    return this.statsRepo.decrementNadeCounter();
  }
}
