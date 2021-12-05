import { Router } from "express";
import { Logger } from "../logger/Logger";

export class StatusRouter {
  private router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  getRouter = () => {
    return this.router;
  };

  private setupRoutes = () => {
    this.router.get("/status", this.statusHandler);
  };

  private statusHandler = async (_, res) => {
    Logger.verbose("StatusRouter.statusHandler");

    return res.send({
      status: "OK",
      serverClock: new Date(),
      uptime: format(process.uptime()),
      node_env: process.env.NODE_ENV,
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
