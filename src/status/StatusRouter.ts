import { Router } from "express";
import { CSGNConfig } from "../config/enironment";

export const makeStatusRouter = (config: CSGNConfig): Router => {
  const router = Router();

  router.get("/status", (req, res) => {
    res.send({
      status: "OK",
      uptime: format(process.uptime()),
      node_env: process.env.NODE_ENV
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
