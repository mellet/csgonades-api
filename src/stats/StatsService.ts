import { StatsRepo } from "./StatsRepo";
import { AppResult } from "../utils/Common";
import { SiteStats } from "./SiteStats";

export class StatsService {
  private statsRepo: StatsRepo;

  constructor(statsRepo: StatsRepo) {
    this.statsRepo = statsRepo;
  }

  async getStats(): AppResult<SiteStats> {
    const result = this.statsRepo.getStats();
    return result;
  }

  async incrementUserCounter() {
    this.statsRepo.incrementUserCounter();
  }

  async incrementNadeCounter() {
    this.statsRepo.incrementNadeCounter();
  }
}
