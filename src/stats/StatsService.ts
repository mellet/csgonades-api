import { SiteStats } from "./SiteStats";
import { StatsRepo } from "./StatsRepo";

export class StatsService {
  private statsRepo: StatsRepo;

  constructor(statsRepo: StatsRepo) {
    this.statsRepo = statsRepo;
  }

  getStats(): Promise<SiteStats | null> {
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

  incrementPendingCounter() {
    return this.statsRepo.incrementPendingCounter();
  }

  decrementPendingCounter() {
    return this.statsRepo.decrementPendingCounter();
  }
}
