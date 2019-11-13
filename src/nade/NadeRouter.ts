import { Router } from "express";
import { NadeRepo } from "./NadeRepo";

export const makeNadeRouter = (nadeRepo: NadeRepo) => {
  const NadeRouter = Router();

  NadeRouter.get("/nade", async (req, res) => {
    const nades = await nadeRepo.get();
    return res.send(nades);
  });

  NadeRouter.get("/nade/:id", async (req, res) => {
    const { id } = req.params;
    const nade = await nadeRepo.byID(id);

    if (!nade) {
      return res.status(404);
    }

    return res.send(nade);
  });

  NadeRouter.post("/nade", async (req, res) => {});

  return NadeRouter;
};
