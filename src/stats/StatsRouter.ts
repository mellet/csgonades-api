import { Router } from "express";
import { StatsService } from "./StatsService";

export const makeStatsRouter = (statsService: StatsService): Router => {
  const StatsRouter = Router();

  StatsRouter.get("/stats", async (req, res) => {
    const result = await statsService.getStats();

    if (result.isErr()) {
      return res.status(result.error.status).send(result.error);
    }

    const stats = result.value;

    return res.status(200).send(stats);
  });

  return StatsRouter;
};
