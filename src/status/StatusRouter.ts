import { Router } from "express";
import { CSGNConfig } from "../config/enironment";
import expAutoSan from "express-autosanitizer";

export const makeStatusRouter = (config: CSGNConfig): Router => {
  const router = Router();

  router.get("/status", expAutoSan.route, (req, res) => {
    res.send({
      status: "OK",
      uptime: format(process.uptime()),
      node_env: process.env.NODE_ENV,
      urlConfig: {
        server: config.server,
        client: config.client
      }
    });
  });

  return router;
};

function format(seconds: number) {
  function pad(s: number) {
    return (s < 10 ? "0" : "") + s;
  }
  const hours = Math.floor(seconds / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  var seconds = Math.floor(seconds % 60);

  return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
}
