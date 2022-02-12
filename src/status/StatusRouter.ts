import { Router } from "express";
import { IAppCaches } from "../cache/initCache";
import { Logger } from "../logger/Logger";

export class StatusRouter {
  private router: Router;
  private caches: IAppCaches;

  constructor(caches: IAppCaches) {
    this.router = Router();
    this.setupRoutes();
    this.caches = caches;
  }

  getRouter = () => {
    return this.router;
  };

  private setupRoutes = () => {
    this.router.get("/status", this.statusHandler);
  };

  private statusHandler = async (_, res) => {
    Logger.verbose("StatusRouter.statusHandler");

    const shorttermCacheStats = this.caches.shorttermCache.stats();
    const longtermCacheStats = this.caches.longtermCache.stats();

    return res.send({
      status: "OK",
      serverClock: new Date(),
      uptime: format(process.uptime()),
      node_env: process.env.NODE_ENV,
      caches: {
        shortTerm: calculateCacheStats(shorttermCacheStats),
        longTerm: calculateCacheStats(longtermCacheStats),
      },
    });
  };
}

function format(seconds: number) {
  function pad(s: number) {
    return (s < 10 ? "0" : "") + s;
  }
  const hours = Math.floor(seconds / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  var seconds = Math.floor(seconds % 60);

  return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
}

function calculateCacheStats(stats: { hits: number; misses: number }) {
  const hitPercentage = (stats.hits * 100) / (stats.misses + stats.hits);

  return {
    hits: stats.hits,
    misses: stats.misses,
    hitPercentage: Math.round(hitPercentage),
  };
}
