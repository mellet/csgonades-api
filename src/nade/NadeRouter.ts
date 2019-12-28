import { Router } from "express";
import { validateNade } from "./NadeMiddleware";
import {
  CsgoMap,
  NadeCreateDTO,
  NadeUpdateDTO,
  NadeStatusDTO,
  NadeGfycatValidateDTO,
  GfycatData
} from "./Nade";
import { INadeService } from "./NadeService";
import { CSGNConfig } from "../config/enironment";
import { authenticateRoute, adminOrModeratorRouter } from "../utils/AuthUtils";
import { userFromRequest } from "../utils/RouterUtils";
import { GfycatService } from "../services/GfycatService";
import { getSessionId } from "../utils/SessionRoute";
import { nadeModelsToLightDTO, nadeDTOfromModel } from "./NadeConverters";
import { sanitizeIt } from "../utils/Sanitize";

type IdParam = {
  id: string;
};

type MapNameParam = {
  mapname: CsgoMap;
};

type SteamIdParam = {
  steamId: string;
};

export const makeNadeRouter = (
  config: CSGNConfig,
  nadeService: INadeService,
  gfycatService: GfycatService
): Router => {
  const NadeRouter = Router();

  NadeRouter.get("/nades", async (_, res) => {
    const nadesResult = await nadeService.fetchNades();

    if (nadesResult.isErr()) {
      const { error } = nadesResult;
      return res.status(error.status).send(error);
    }

    const nades = nadeModelsToLightDTO(nadesResult.value);

    return res.status(200).send(nades);
  });

  NadeRouter.get<IdParam>("/nades/:id", async (req, res) => {
    const id = sanitizeIt(req.params.id);

    const nadeResult = await nadeService.fetchByID(id);

    if (nadeResult.isErr()) {
      const { error } = nadeResult;
      return res.status(error.status).send(error);
    }

    const nade = nadeDTOfromModel(nadeResult.value);

    return res.status(200).send(nade);
  });

  NadeRouter.get<MapNameParam>("/nades/map/:mapname", async (req, res) => {
    const mapname = sanitizeIt(req.params.mapname);

    const nadesResult = await nadeService.fetchByMap(mapname);

    if (nadesResult.isErr()) {
      const { error } = nadesResult;
      return res.status(error.status).send(error);
    }

    const nades = nadeModelsToLightDTO(nadesResult.value);

    return res.status(200).send(nades);
  });

  NadeRouter.get<SteamIdParam>("/nades/user/:steamId", async (req, res) => {
    const steamId = sanitizeIt(req.params.steamId);

    const nadeResult = await nadeService.fetchByUser(steamId);

    if (nadeResult.isErr()) {
      return res.status(500).send(nadeResult.error);
    }

    const nades = nadeModelsToLightDTO(nadeResult.value);

    return res.status(200).send(nades);
  });

  const postNadeMiddleware = [authenticateRoute, validateNade];

  NadeRouter.post("/nades", ...postNadeMiddleware, async (req, res) => {
    const user = userFromRequest(req);
    const dirtyNadeBody = req.body as NadeCreateDTO;
    const nadeBody: NadeCreateDTO = {
      gfycatIdOrUrl: sanitizeIt(dirtyNadeBody.gfycatIdOrUrl),
      imageBase64: dirtyNadeBody.imageBase64
    };

    const nadeResult = await nadeService.saveFromBody(nadeBody, user.steamId);

    if (nadeResult.isErr()) {
      const { error } = nadeResult;
      return res.status(error.status).send(error);
    }

    const nade = nadeDTOfromModel(nadeResult.value);

    return res.status(201).send(nade);
  });

  NadeRouter.post("/nades/list", async (req, res) => {
    const nadeList = req.body.nadeIds as string[];

    console.log("Requested to get nadelist", nadeList);

    const nadeResult = await nadeService.fetchByIdList(nadeList);

    if (nadeResult.isErr()) {
      const { error } = nadeResult;
      return res.status(404).send(error);
    }

    const nades = nadeModelsToLightDTO(nadeResult.value);

    console.log("Found nades", nades.length);

    return res.status(200).send(nades);
  });

  NadeRouter.put<IdParam>("/nades/:id", authenticateRoute, async (req, res) => {
    const id = sanitizeIt(req.params.id);
    const user = userFromRequest(req);

    const dirtyNadeBody = req.body as NadeUpdateDTO; // TODO: Validate NadeUpdateBody
    const nadeBody = sanitizeIt(dirtyNadeBody);

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
  });

  NadeRouter.post<IdParam>("/nades/:id/countView", (req, res) => {
    const id = sanitizeIt(req.params.id);
    const identifier = getSessionId(req);

    if (identifier) {
      gfycatService.registerView(id, identifier);
      return res.status(202).send();
    } else {
      return res.status(406).send();
    }
  });

  NadeRouter.patch<{ nadeId: string; steamId: string }>(
    "/nades/:nadeId/setuser/:steamId",
    adminOrModeratorRouter,
    async (req, res) => {
      const nadeId = sanitizeIt(req.params.nadeId);
      const steamId = sanitizeIt(req.params.steamId);

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
    adminOrModeratorRouter,
    async (req, res) => {
      const id = sanitizeIt(req.params.id);
      const user = userFromRequest(req);
      const dirtyStatusUpdate = req.body as NadeStatusDTO; // TODO: Validate NadeStatusDTO
      const statusUpdate = sanitizeIt(dirtyStatusUpdate);

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

  NadeRouter.post("/nades/validateGfycat", async (req, res) => {
    const validateGfycat = req.body as NadeGfycatValidateDTO;

    const result = await gfycatService.getGfycatData(
      validateGfycat.gfycatIdOrUrl
    );

    if (result.isErr()) {
      return res.status(500).send(result.error);
    }

    const { gfyItem } = result.value;

    const gfyData: GfycatData = {
      gfyId: gfyItem.gfyId,
      smallVideoUrl: gfyItem.mobileUrl,
      largeVideoUrl: gfyItem.mp4Url
    };

    return res.status(200).send(gfyData);
  });

  return NadeRouter;
};
