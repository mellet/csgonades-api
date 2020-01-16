import { Router } from "express";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { StatsService } from "./StatsService";

export const makeStatsRouter = (statsService: StatsService): Router => {
  const StatsRouter = Router();

  StatsRouter.get("/stats", async (req, res) => {
    try {
      const result = await statsService.getStats();

      if (!result) {
        return res.status(404).send();
      }

      return res.status(200).send(result);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  return StatsRouter;
};
