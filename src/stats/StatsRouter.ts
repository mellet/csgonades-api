import { Router } from "express";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { StatsRepo } from "./repository/StatsRepo";

export const makeStatsRouter = (statsRepo: StatsRepo): Router => {
  const StatsRouter = Router();

  StatsRouter.get("/stats", async (_, res) => {
    try {
      const result = await statsRepo.getStats();

      if (!result) {
        return res.status(404).send();
      }

      return res.status(200).send(result);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  StatsRouter.get("/client-config", async (_, res) => {
    try {
      const clientConfig = await statsRepo.getClientConfig();

      if (!clientConfig) {
        return res.status(404).send();
      }

      return res.status(200).send(clientConfig);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  return StatsRouter;
};
