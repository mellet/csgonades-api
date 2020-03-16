import { NadeDTO } from "../nade/Nade";
import { CachingService } from "../services/CachingService";
import { EventBus } from "../services/EventHandler";
import { SiteStats } from "./SiteStats";
import { StatsRepo } from "./StatsRepo";

type StatsServiceDeps = {
  statsRepo: StatsRepo;
  eventBus: EventBus;
  cacheService: CachingService;
};

export class StatsService {
  private statsRepo: StatsRepo;

  private cacheService: CachingService;

  constructor(deps: StatsServiceDeps) {
    const { eventBus, statsRepo, cacheService } = deps;
    this.statsRepo = statsRepo;
    this.cacheService = cacheService;

    eventBus.subNewNade(this.onNewNade);
    eventBus.subNadeDelete(this.onNadeDelete);
    eventBus.subAcceptedNade(this.onNadeAccepted);
    eventBus.subDeclinedNade(this.onNadeDeclined);
    eventBus.subNewUser(this.incrementUserCounter);
  }

  getStats(): Promise<SiteStats | null> {
    return this.statsRepo.getStats();
  }

  getClientConfig = async () => {
    const cachedConfig = this.cacheService.getGeneric("clientConfig");
    if (cachedConfig) {
      return cachedConfig;
    }

    const clientConfig = await this.statsRepo.getClientConfig();

    if (clientConfig) {
      this.cacheService.setGeneric("clientConfig", clientConfig);
    }

    return clientConfig;
  };

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
