import { NadeDTO } from "../nade/Nade";
import { EventBus } from "../services/EventHandler";
import { SiteStats } from "./SiteStats";
import { StatsRepo } from "./StatsRepo";

type StatsServiceDeps = {
  statsRepo: StatsRepo;
  eventBus: EventBus;
};

export class StatsService {
  private statsRepo: StatsRepo;

  constructor(deps: StatsServiceDeps) {
    const { eventBus, statsRepo } = deps;
    this.statsRepo = statsRepo;

    eventBus.subNewNade(this.onNewNade);
    eventBus.subNadeDelete(this.onNadeDelete);
    eventBus.subAcceptedNade(this.onNadeAccepted);
    eventBus.subDeclinedNade(this.onNadeDeclined);
    eventBus.subNewUser(this.incrementUserCounter);
  }

  getStats(): Promise<SiteStats | null> {
    return this.statsRepo.getStats();
  }

  private incrementUserCounter = () => {
    return this.statsRepo.incrementUserCounter();
  };

  private onNewNade = () => {
    this.statsRepo.incrementNadeCounter();
    this.statsRepo.incrementPendingCounter();
  };

  private onNadeDelete = (nade: NadeDTO) => {
    if (nade.status === "pending") {
      this.statsRepo.decrementPendingCounter();
    }
    this.statsRepo.decrementNadeCounter();
  };

  private onNadeAccepted = (nade: NadeDTO) => {
    this.statsRepo.decrementPendingCounter();
  };

  private onNadeDeclined = (nade: NadeDTO) => {
    this.statsRepo.decrementPendingCounter();
  };
}
