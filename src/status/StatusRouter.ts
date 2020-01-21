import { RequestHandler, Router } from "express";
import { CachingService } from "../services/CachingService";

type StatusRouterDeps = {
  cache: CachingService;
};

export class StatusRouter {
  private cache: CachingService;
  private router: Router;

  constructor(deps: StatusRouterDeps) {
    this.router = Router();
    this.cache = deps.cache;
    this.setupRoutes();
  }

  getRouter = () => {
    return this.router;
  };

  private setupRoutes = () => {
    this.router.get("/status", this.statusHandler);
  };

  private statusHandler: RequestHandler = async (req, res) => {
    return res.send({
      status: "OK",
      serverClock: new Date(),
      uptime: format(process.uptime()),
      node_env: process.env.NODE_ENV,
      cache: this.cache.getStats()
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
