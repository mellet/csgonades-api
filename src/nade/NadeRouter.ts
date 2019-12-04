import { Router } from "express";
import { validateNade } from "./NadeMiddleware";
import { CsgoMap, NadeBody, NadeUpdateBody } from "./Nade";
import { NadeService } from "./NadeService";
import { createHttpError } from "../utils/ErrorUtil";
import { CSGNConfig } from "../config/enironment";
import { authenticateRoute } from "../utils/AuthUtils";
import { userFromRequest } from "../utils/RouterUtils";
import { GfycatService } from "../services/GfycatService";
import { getSessionId } from "../utils/SessionRoute";

type IdParam = {
  id: string;
};

type MapNameParam = {
  mapname: CsgoMap;
};

export const makeNadeRouter = (
  config: CSGNConfig,
  nadeService: NadeService,
  gfycatService: GfycatService
): Router => {
  const NadeRouter = Router();

  NadeRouter.get("/nades", async (_, res) => {
    try {
      const nades = await nadeService.fetchNades();
      return res.send(nades);
    } catch (error) {
      const errorMessage = createHttpError(error.message);
      return res.status(400).send(errorMessage);
    }
  });

  NadeRouter.get<IdParam>("/nades/:id", async (req, res) => {
    const { id } = req.params; // TODO: Sanitze

    try {
      const nade = await nadeService.fetchByID(id);
      if (!nade) {
        return res.status(404).send({
          error: "Nade not found"
        });
      }

      return res.status(200).send(nade);
    } catch (error) {
      console.error(error);
      const errorMessage = createHttpError(error.message);
      return res.status(400).send(errorMessage);
    }
  });

  NadeRouter.get<MapNameParam>("/nades/map/:mapname", async (req, res) => {
    const mapname = req.params.mapname; // TODO: Sanitze

    try {
      const nades = await nadeService.fetchByMap(mapname);
      return res.send(nades);
    } catch (error) {
      const errorMessage = createHttpError(error.message);
      return res.status(400).send(errorMessage);
    }
  });

  const postNadeMiddleware = [authenticateRoute, validateNade];

  NadeRouter.post("/nades", ...postNadeMiddleware, async (req, res) => {
    const user = userFromRequest(req);

    try {
      const nadeBody = req.body as NadeBody;
      const nadeDoc = await nadeService.saveFromBody(nadeBody, user.steamId);
      return res.status(201).send(nadeDoc);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  });

  const putNadeMiddleware = [authenticateRoute];

  NadeRouter.put<IdParam>(
    "/nades/:id",
    ...putNadeMiddleware,
    async (req, res) => {
      const { id } = req.params; // TODO: Sanitze
      const user = userFromRequest(req);

      const nadeBody = req.body as NadeUpdateBody; // TODO: Validate NadeUpdateBody

      try {
        const isAllowedEdit = await nadeService.isAllowedEdit(id, user.steamId);

        if (!isAllowedEdit) {
          return res
            .status(401)
            .send({ error: "Not allowed to edit this nade" });
        }

        const updatedNade = await nadeService.update(nadeBody, id);

        return res.status(202).send(updatedNade);
      } catch (error) {
        console.error("NadeRouter.put(/nades/:id)", error);
        return res.status(400).send({ error: error.message });
      }
    }
  );

  NadeRouter.post<IdParam>("/nades/:id/countView", (req, res) => {
    const { id } = req.params;
    const identifier = getSessionId(req);

    console.log("Trying to count view for", identifier);

    if (identifier) {
      gfycatService.registerView(id, identifier);
    }
  });

  return NadeRouter;
};
