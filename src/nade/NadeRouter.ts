import { RequestHandler, Router } from "express";
import { GfycatService } from "../services/GfycatService";
import { adminOrModHandler, authOnlyHandler } from "../utils/AuthUtils";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { userFromRequest } from "../utils/RouterUtils";
import { sanitizeIt } from "../utils/Sanitize";
import { getSessionId } from "../utils/SessionRoute";
import {
  CsgoMap,
  GfycatData,
  NadeCreateDTO,
  NadeGfycatValidateDTO,
  NadeStatusDTO,
  NadeUpdateDTO
} from "./Nade";
import { validateNade } from "./NadeMiddleware";
import { NadeService } from "./NadeService";

type IdParam = {
  id: string;
};

type MapNameParam = {
  mapname: CsgoMap;
};

type SteamIdParam = {
  steamId: string;
};

type NadeRouterServices = {
  nadeService: NadeService;
  gfycatService: GfycatService;
};

export class NadeRouter {
  private router: Router;
  private nadeService: NadeService;
  private gfycatService: GfycatService;

  constructor(services: NadeRouterServices) {
    this.nadeService = services.nadeService;
    this.gfycatService = services.gfycatService;
    this.router = Router();
    this.setUpRoutes();
  }

  getRouter = (): Router => {
    return this.router;
  };

  private setUpRoutes = () => {
    this.router.get("/nades", this.getNades);
    this.router.get("/nades/pending", adminOrModHandler, this.getPendingNades);
    this.router.get("/nades/:id", this.getById);
    this.router.get("/nades/map/:mapname", this.getByMap);
    this.router.get("/nades/user/:steamId", this.getByUser);
    this.router.post("/nades", authOnlyHandler, validateNade, this.addNade);
    this.router.put("/nades/:id", authOnlyHandler, this.updateNade);
    this.router.post("/nades/:id/countView", this.incrementViewCount);
    this.router.patch(
      "/nades/:id/status",
      adminOrModHandler,
      this.updateStatus
    );
    this.router.post("/nades/validateGfycat", this.validateGfy);
    this.router.delete("/nades/:id", adminOrModHandler, this.deleteNade);
    this.router.post("/nades/list", this.getByIdList);
  };

  private getNades: RequestHandler = async (req, res) => {
    try {
      const limitParam = req?.query?.limit;
      let limit: number | undefined = undefined;

      if (!limitParam) {
        limit = 12;
      } else if (limitParam === "all") {
        limit = undefined;
      } else {
        limit = Number(limit);
      }

      const nades = await this.nadeService.fetchNades(limit);

      return res.status(200).send(nades);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private getPendingNades: RequestHandler = async (req, res) => {
    try {
      const pendingNades = await this.nadeService.pending();

      return res.status(200).send(pendingNades);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private getById: RequestHandler<IdParam> = async (req, res) => {
    try {
      const id = sanitizeIt(req.params.id);

      const nade = await this.nadeService.byId(id);

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
  };

  private getByIdList = async (req, res) => {
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

      const nades = await this.nadeService.list(nadeList);

      return res.status(200).send(nades);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private getByMap: RequestHandler<MapNameParam> = async (req, res) => {
    try {
      const mapName = sanitizeIt(req.params.mapname);
      const nades = await this.nadeService.byMap(mapName);

      return res.status(200).send(nades);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private getByUser: RequestHandler<SteamIdParam> = async (req, res) => {
    try {
      const steamId = sanitizeIt(req.params.steamId);
      const nades = await this.nadeService.byUser(steamId);

      return res.status(200).send(nades);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private addNade: RequestHandler = async (req, res) => {
    try {
      const user = userFromRequest(req);
      const dirtyNadeBody = req.body as NadeCreateDTO;
      const nadeBody: NadeCreateDTO = {
        gfycatIdOrUrl: sanitizeIt(dirtyNadeBody.gfycatIdOrUrl),
        imageBase64: dirtyNadeBody.imageBase64
      };

      const nade = await this.nadeService.save(nadeBody, user.steamId);

      return res.status(201).send(nade);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private updateNade: RequestHandler = async (req, res) => {
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

      const isAllowedEdit = await this.nadeService.isAllowedEdit(
        id,
        user.steamId
      );

      if (!isAllowedEdit) {
        return res.status(401).send({ error: "Not allowed to edit this nade" });
      }

      const nade = await this.nadeService.update(id, nadeBody);

      return res.status(202).send(nade);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private incrementViewCount: RequestHandler<IdParam> = async (req, res) => {
    try {
      const id = sanitizeIt(req.params.id);
      const identifier = getSessionId(req);

      if (identifier) {
        await this.gfycatService.registerView(id, identifier);
        return res.status(202).send();
      } else {
        return res.status(406).send();
      }
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private updateStatus: RequestHandler<IdParam> = async (req, res) => {
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

      const nade = await this.nadeService.updateNadeStatus(id, statusUpdate);

      return res.status(202).send(nade);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private validateGfy: RequestHandler = async (req, res) => {
    try {
      const validateGfycat = req.body as NadeGfycatValidateDTO;

      const gfyDataResponse = await this.gfycatService.getGfycatData(
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
        largeVideoUrl: gfyItem.mp4Url,
        largeVideoWebm: gfyItem.webmUrl
      };

      return res.status(200).send(gfyData);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private deleteNade: RequestHandler<IdParam> = async (req, res) => {
    try {
      const id = sanitizeIt(req.params.id);

      await this.nadeService.delete(id);

      return res.status(204).send();
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };
}
