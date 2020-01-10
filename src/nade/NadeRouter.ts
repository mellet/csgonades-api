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
import { CSGNConfig } from "../config/enironment";
import { authOnlyHandler, adminOrModHandler } from "../utils/AuthUtils";
import { userFromRequest } from "../utils/RouterUtils";
import { GfycatService } from "../services/GfycatService";
import { getSessionId } from "../utils/SessionRoute";
import { sanitizeIt } from "../utils/Sanitize";
import { NadeService } from "./NadeService";
import { errorCatchConverter } from "../utils/ErrorUtil";

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
  nadeService: NadeService,
  gfycatService: GfycatService
): Router => {
  const NadeRouter = Router();

  NadeRouter.get("/nades", async (req, res) => {
    try {
      const limitParam = req?.query?.limit;
      let limit: number | undefined = undefined;

      if (!limitParam) {
        limit = 8;
      } else if (limitParam === "all") {
        limit = undefined;
      } else {
        limit = Number(limit);
      }

      const nades = await nadeService.fetchNades(limit);

      return res.status(200).send(nades);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  NadeRouter.get("/nades/pending", adminOrModHandler, async (req, res) => {
    try {
      const pendingNades = await nadeService.pending();

      return res.status(200).send(pendingNades);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  NadeRouter.get<IdParam>("/nades/:id", async (req, res) => {
    try {
      const id = sanitizeIt(req.params.id);

      const nade = await nadeService.byId(id);

      if (!nade) {
        return res.status(404).send({
          status: 404,
          message: "Nade not found."
        });
      }

      return res.status(200).send(nade);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  NadeRouter.get<MapNameParam>("/nades/map/:mapname", async (req, res) => {
    try {
      const mapName = sanitizeIt(req.params.mapname);
      const nades = await nadeService.byMap(mapName);

      return res.status(200).send(nades);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  NadeRouter.get<SteamIdParam>("/nades/user/:steamId", async (req, res) => {
    try {
      const steamId = sanitizeIt(req.params.steamId);
      const nades = await nadeService.byUser(steamId);

      return res.status(200).send(nades);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  const postNadeMiddleware = [authOnlyHandler, validateNade];

  NadeRouter.post("/nades", ...postNadeMiddleware, async (req, res) => {
    try {
      const user = userFromRequest(req);
      const dirtyNadeBody = req.body as NadeCreateDTO;
      const nadeBody: NadeCreateDTO = {
        gfycatIdOrUrl: sanitizeIt(dirtyNadeBody.gfycatIdOrUrl),
        imageBase64: dirtyNadeBody.imageBase64
      };

      const nade = await nadeService.save(nadeBody, user.steamId);

      return res.status(201).send(nade);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  NadeRouter.post("/nades/list", async (req, res) => {
    try {
      const nadeList = req.body.nadeIds as string[];

      if (!nadeList) {
        return res
          .status(400)
          .send({ status: 400, message: "Missing nade ids in body" });
      }

      if (nadeList.length === 0) {
        return res.status(200).send([]);
      }

      const nades = await nadeService.list(nadeList);

      return res.status(200).send(nades);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  NadeRouter.put<IdParam>("/nades/:id", authOnlyHandler, async (req, res) => {
    try {
      const id = sanitizeIt(req.params.id);
      const user = userFromRequest(req);

      const dirtyNadeBody = req.body as NadeUpdateDTO; // TODO: Validate NadeUpdateBody
      const nadeBody: NadeUpdateDTO = {
        ...sanitizeIt(dirtyNadeBody),
        description: dirtyNadeBody.description // TODO: Sanitize markdown
      };

      if (nadeBody.createdAt && user.role === "user") {
        return res.status(403).send({ status: 403, message: "Forbidden" });
      }

      const isAllowedEdit = await nadeService.isAllowedEdit(id, user.steamId);

      if (!isAllowedEdit) {
        return res.status(401).send({ error: "Not allowed to edit this nade" });
      }

      const nade = await nadeService.update(id, nadeBody);

      return res.status(202).send(nade);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  NadeRouter.post<IdParam>("/nades/:id/countView", async (req, res) => {
    try {
      const id = sanitizeIt(req.params.id);
      const identifier = getSessionId(req);

      if (identifier) {
        await gfycatService.registerView(id, identifier);
        return res.status(202).send();
      } else {
        return res.status(406).send();
      }
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  NadeRouter.patch<IdParam>(
    "/nades/:id/status",
    adminOrModHandler,
    async (req, res) => {
      try {
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

        const nade = await nadeService.updateNadeStatus(id, statusUpdate);

        return res.status(202).send(nade);
      } catch (error) {
        const err = errorCatchConverter(error);
        return res.status(err.code).send(err);
      }
    }
  );

  NadeRouter.post("/nades/validateGfycat", async (req, res) => {
    try {
      const validateGfycat = req.body as NadeGfycatValidateDTO;

      const gfyDataResponse = await gfycatService.getGfycatData(
        validateGfycat.gfycatIdOrUrl
      );

      if (!gfyDataResponse) {
        return res.status(500).send({
          message: "Gfycat seems to be down."
        });
      }

      const { gfyItem } = gfyDataResponse;

      const gfyData: GfycatData = {
        gfyId: gfyItem.gfyId,
        smallVideoUrl: gfyItem.mobileUrl,
        largeVideoUrl: gfyItem.mp4Url
      };

      return res.status(200).send(gfyData);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  NadeRouter.delete<IdParam>(
    "/nades/:id",
    adminOrModHandler,
    async (req, res) => {
      try {
        const id = sanitizeIt(req.params.id);

        await nadeService.delete(id);

        return res.status(204).send();
      } catch (error) {
        const err = errorCatchConverter(error);
        return res.status(err.code).send(err);
      }
    }
  );

  return NadeRouter;
};
