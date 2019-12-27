import { Router } from "express";
import { validateNade } from "./NadeMiddleware";
import { CsgoMap, NadeBody, NadeUpdateDTO, NadeStatusDTO } from "./Nade";
import { INadeService } from "./NadeService";
import { CSGNConfig } from "../config/enironment";
import { authenticateRoute, adminOrModeratorRouter } from "../utils/AuthUtils";
import { userFromRequest } from "../utils/RouterUtils";
import { GfycatService } from "../services/GfycatService";
import { getSessionId } from "../utils/SessionRoute";
import { nadeModelsToLightDTO, nadeDTOfromModel } from "./NadeConverters";
import expAutoSan from "express-autosanitizer";

type IdParam = {
  id: string;
};

type MapNameParam = {
  mapname: CsgoMap;
};

export const makeNadeRouter = (
  config: CSGNConfig,
  nadeService: INadeService,
  gfycatService: GfycatService
): Router => {
  const NadeRouter = Router();

  NadeRouter.get("/nades", expAutoSan.route, async (_, res) => {
    const nadesResult = await nadeService.fetchNades();

    if (nadesResult.isErr()) {
      const { error } = nadesResult;
      return res.status(error.status).send(error);
    }

    const nades = nadeModelsToLightDTO(nadesResult.value);

    return res.status(200).send(nades);
  });

  NadeRouter.get<IdParam>("/nades/:id", expAutoSan.route, async (req, res) => {
    const { id } = req.params;

    const nadeResult = await nadeService.fetchByID(id);

    if (nadeResult.isErr()) {
      const { error } = nadeResult;
      return res.status(error.status).send(error);
    }

    const nade = nadeDTOfromModel(nadeResult.value);

    return res.status(200).send(nade);
  });

  NadeRouter.get<MapNameParam>(
    "/nades/map/:mapname",
    expAutoSan.route,
    async (req, res) => {
      const mapname = req.params.mapname;

      const nadesResult = await nadeService.fetchByMap(mapname);

      if (nadesResult.isErr()) {
        const { error } = nadesResult;
        return res.status(error.status).send(error);
      }

      const nades = nadeModelsToLightDTO(nadesResult.value);

      return res.status(200).send(nades);
    }
  );

  const postNadeMiddleware = [
    expAutoSan.route,
    authenticateRoute,
    validateNade
  ];

  NadeRouter.post("/nades", ...postNadeMiddleware, async (req, res) => {
    const user = userFromRequest(req);

    const nadeBody = req.body as NadeBody;
    const nadeResult = await nadeService.saveFromBody(nadeBody, user.steamId);

    if (nadeResult.isErr()) {
      const { error } = nadeResult;
      return res.status(error.status).send(error);
    }

    const nade = nadeDTOfromModel(nadeResult.value);

    return res.status(201).send(nade);
  });

  const putNadeMiddleware = [expAutoSan.route, authenticateRoute];

  NadeRouter.put<IdParam>(
    "/nades/:id",
    ...putNadeMiddleware,
    async (req, res) => {
      const { id } = req.params;
      const user = userFromRequest(req);

      const nadeBody = req.body as NadeUpdateDTO; // TODO: Validate NadeUpdateBody

      const isAllowedEdit = await nadeService.isAllowedEdit(id, user.steamId);

      if (!isAllowedEdit) {
        return res.status(401).send({ error: "Not allowed to edit this nade" });
      }

      const updatedNadeResult = await nadeService.update(id, nadeBody);

      if (updatedNadeResult.isErr()) {
        const { error } = updatedNadeResult;
        return res.status(error.status).send(error);
      }

      const nade = nadeDTOfromModel(updatedNadeResult.value);

      return res.status(202).send(nade);
    }
  );

  NadeRouter.post<IdParam>(
    "/nades/:id/countView",
    expAutoSan.route,
    (req, res) => {
      const { id } = req.params;
      const identifier = getSessionId(req);

      if (identifier) {
        gfycatService.registerView(id, identifier);
        return res.status(202).send();
      } else {
        return res.status(406).send();
      }
    }
  );

  NadeRouter.patch<{ nadeId: string; steamId: string }>(
    "/nades/:nadeId/setuser/:steamId",
    expAutoSan.route,
    adminOrModeratorRouter,
    async (req, res) => {
      const { nadeId, steamId } = req.params; // TODO: Sanitize
      const successResult = await nadeService.forceUserUpdate(nadeId, steamId);
      if (successResult.isErr()) {
        const { error } = successResult;
        return res.status(error.status).send(error);
      }

      const nade = nadeDTOfromModel(successResult.value);

      return res.status(201).send(nade);
    }
  );

  NadeRouter.patch<IdParam>(
    "/nades/:id/status",
    expAutoSan.route,
    adminOrModeratorRouter,
    async (req, res) => {
      const { id } = req.params; // TODO: Sanitize
      const statusUpdate = req.body as NadeStatusDTO;
      const user = userFromRequest(req);

      if (user.role !== "moderator" && user.role !== "administrator") {
        return res.status(403).send({
          error:
            "Only administrator or administrator are allowed to update nade status."
        });
      }

      const result = await nadeService.updateNadeStatus(id, statusUpdate);

      if (result.isErr()) {
        return res.status(result.error.status).send(result.error);
      }

      const nade = nadeDTOfromModel(result.value);

      return res.status(202).send(nade);
    }
  );

  return NadeRouter;
};
