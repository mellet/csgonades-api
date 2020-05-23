import * as Sentry from "@sentry/node";
import { RequestHandler, Router } from "express";
import { GfycatService } from "../services/GfycatService";
import { adminOrModHandler, authOnlyHandler } from "../utils/AuthUtils";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { userFromRequest } from "../utils/RouterUtils";
import { sanitizeIt } from "../utils/Sanitize";
import { getSessionId } from "../utils/SessionRoute";
import { CsgoMap, GfycatData, NadeDTO, NadeGfycatValidateDTO } from "./Nade";
import { NadeService } from "./NadeService";
import { validateNadeCreateBody, validateNadeEditBody } from "./NadeValidators";

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
    this.router.get(
      "/nades/declined",
      adminOrModHandler,
      this.getDeclinedNades
    );
    this.router.get("/nades/:id", this.getById);
    this.router.get("/nades/map/:mapname", this.getByMap);
    this.router.get("/nades/user/:steamId", this.getByUser);
    this.router.post("/nades", authOnlyHandler, this.addNade);
    this.router.put("/nades/:id", authOnlyHandler, this.updateNade);
    this.router.post("/nades/:id/countView", this.incrementViewCount);
    this.router.post("/nades/validateGfycat", this.validateGfy);
    this.router.delete("/nades/:id", adminOrModHandler, this.deleteNade);
    this.router.post("/nades/list", this.getByIdList);
    this.router.get("/nades/:id/checkslug", this.checkSlug);
  };

  private checkSlug: RequestHandler<IdParam> = async (req, res) => {
    try {
      const slug = req.params.id;
      const slugIsFree = await this.nadeService.slugIsFree(slug);

      return res.status(200).send(slugIsFree);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private getNades: RequestHandler = async (req, res) => {
    try {
      const limitParam = req?.query?.limit;
      let limit: number | undefined = undefined;
      let noCache = false;

      if (!limitParam) {
        limit = 8;
      } else if (limitParam === "all") {
        limit = undefined;
        noCache = true;
      } else {
        limit = Number(limit);
      }

      const nades = await this.nadeService.fetchNades(limit, noCache);

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

  private getDeclinedNades: RequestHandler = async (_, res) => {
    try {
      const declinedNades = await this.nadeService.declined();

      return res.status(200).send(declinedNades);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private getById: RequestHandler<IdParam> = async (req, res) => {
    try {
      const id = sanitizeIt(req.params.id);

      let nade: NadeDTO | null = null;

      if (this.isSlug(id)) {
        nade = await this.nadeService.bySlug(id);
      } else {
        nade = await this.nadeService.byId(id);
      }

      if (!nade) {
        return res.status(404).send({
          status: 404,
          message: "Nade not found.",
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
      const nadeBody = validateNadeCreateBody(req);

      const nade = await this.nadeService.save(nadeBody, user.steamId);

      return res.status(201).send(nade);
    } catch (error) {
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private updateNade: RequestHandler = async (req, res) => {
    try {
      const id = sanitizeIt(req.params.id);
      const user = userFromRequest(req);
      const updateDto = validateNadeEditBody(req);

      const isAllowedEdit = await this.nadeService.isAllowedEdit(
        id,
        user.steamId
      );

      if (updateDto.slug && user.role !== "administrator") {
        return res.status(401).send({ error: "Not allowed to update slug" });
      }

      if (updateDto.status && user.role === "user") {
        return res.status(401).send({ error: "Not allowed edit status" });
      }

      if (!isAllowedEdit) {
        return res.status(401).send({ error: "Not allowed to edit this nade" });
      }

      const nade = await this.nadeService.update(id, updateDto);

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

  private validateGfy: RequestHandler = async (req, res) => {
    try {
      const validateGfycat = req.body as NadeGfycatValidateDTO;

      const gfyDataResponse = await this.gfycatService.getGfycatData(
        validateGfycat.gfycatIdOrUrl
      );

      if (!gfyDataResponse) {
        return res.status(500).send({
          message: "Gfycat seems to be down.",
        });
      }

      const { gfyItem } = gfyDataResponse;

      const gfyData: GfycatData = {
        gfyId: gfyItem.gfyId,
        smallVideoUrl: gfyItem.mobileUrl,
        largeVideoUrl: gfyItem.mp4Url,
        largeVideoWebm: gfyItem.webmUrl,
        avgColor: gfyItem.avgColor,
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

  private isSlug = (value: string) => {
    return value.includes("-");
  };
}
