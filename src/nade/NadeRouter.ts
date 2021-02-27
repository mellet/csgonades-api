import * as Sentry from "@sentry/node";
import { RequestHandler, Router } from "express";
import { AuditService } from "../audit/AuditService";
import { CreateAuditDto } from "../audit/dto/CreateAuditDto";
import { UserAudit } from "../audit/dto/UserAudit";
import { CommentService } from "../comment/CommentService";
import { GfycatApi } from "../external-api/GfycatApi";
import { Logger } from "../logger/Logger";
import { UserService } from "../user/UserService";
import { createAppContext } from "../utils/AppContext";
import {
  adminOnlyHandler,
  adminOrModHandler,
  authOnlyHandler,
} from "../utils/AuthHandlers";
import { errorCatchConverter, ErrorFactory } from "../utils/ErrorUtil";
import { userFromRequest } from "../utils/RouterUtils";
import { sanitizeIt } from "../utils/Sanitize";
import { getSessionId } from "../utils/SessionRoute";
import { GfycatData } from "./dto/GfycatData";
import { NadeDto } from "./dto/NadeDto";
import { NadeGfycatValidateDto } from "./dto/NadeGfycatValidateDto";
import { NadeService } from "./NadeService";
import { CsgoMap } from "./nadeSubTypes/CsgoMap";
import {
  validateNadeCreateBody,
  validateNadeEditBody,
} from "./utils/NadeValidators";

type NadeRouterServices = {
  nadeService: NadeService;
  gfycatApi: GfycatApi;
  auditService: AuditService;
  userService: UserService;
  commentService: CommentService;
};

export class NadeRouter {
  private router: Router;
  private nadeService: NadeService;
  private gfycatApi: GfycatApi;
  private auditServer: AuditService;
  private userService: UserService;

  constructor(services: NadeRouterServices) {
    this.nadeService = services.nadeService;
    this.gfycatApi = services.gfycatApi;
    this.auditServer = services.auditService;
    this.userService = services.userService;
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
    this.router.delete("/nades/:id", adminOnlyHandler, this.deleteNade);
    this.router.get("/nades/:id/checkslug", this.checkSlug);

    // Favorite routes
    this.router.post("/nades/:id/favorite", authOnlyHandler, this.favorite);
    this.router.delete("/nades/:id/favorite", authOnlyHandler, this.unFavorite);
  };

  private favorite: RequestHandler = async (req, res) => {
    try {
      const user = userFromRequest(req);
      const nadeId = sanitizeIt(req.params.id);

      if (!user || !user.steamId) {
        throw ErrorFactory.Forbidden("Not signed in");
      }

      if (!nadeId) {
        throw ErrorFactory.BadRequest("Not signed in or no nade selected");
      }

      const favorite = await this.nadeService.favoriteNade(
        nadeId,
        user.steamId
      );

      return res.status(201).send(favorite);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private unFavorite: RequestHandler = async (req, res) => {
    try {
      const user = userFromRequest(req);
      const nadeId = sanitizeIt(req.params.id);

      if (!user || !user.steamId) {
        throw ErrorFactory.Forbidden("Not signed in");
      }

      if (!nadeId) {
        throw ErrorFactory.BadRequest("Not signed in or no nade selected");
      }

      await this.nadeService.unFavoriteNade(nadeId, user.steamId);
      return res.status(204).send();
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private checkSlug: RequestHandler = async (req, res) => {
    try {
      const slug = req.params.id;
      const slugIsFree = await this.nadeService.isSlugAvailable(slug);

      return res.status(200).send(slugIsFree);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private getNades = async (req, res) => {
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

      const nades = await this.nadeService.getRecent(limit);

      return res.status(200).send(nades);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private getPendingNades: RequestHandler = async (_, res) => {
    try {
      const pendingNades = await this.nadeService.getPending();

      return res.status(200).send(pendingNades);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private getDeclinedNades: RequestHandler = async (_, res) => {
    try {
      const declinedNades = await this.nadeService.getDeclined();

      return res.status(200).send(declinedNades);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private getById = async (req, res) => {
    try {
      const id = sanitizeIt(req.params.id);

      let nade: NadeDto | null = null;

      if (this.isSlug(id)) {
        nade = await this.nadeService.getBySlug(id);
      } else {
        nade = await this.nadeService.getById(id);
      }

      if (!nade) {
        return res.status(404).send({
          status: 404,
          message: "Nade not found.",
        });
      }

      return res.status(200).send(nade);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private getByMap = async (req, res) => {
    try {
      const mapName = sanitizeIt(req.params.mapname) as CsgoMap;
      const nades = await this.nadeService.getByMap(mapName);

      return res.status(200).send(nades);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private getByUser = async (req, res) => {
    try {
      const steamId = sanitizeIt(req.params.steamId);
      const nades = await this.nadeService.getByUser(steamId);

      return res.status(200).send(nades);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private addNade = async (req, res) => {
    try {
      const user = userFromRequest(req);
      const nadeBody = validateNadeCreateBody(req);

      const nade = await this.nadeService.save(nadeBody, user.steamId);

      return res.status(201).send(nade);
    } catch (error) {
      Logger.error(error);
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private updateNade = async (req, res) => {
    try {
      const id = sanitizeIt(req.params.id);
      const context = createAppContext(req);
      const user = userFromRequest(req);
      const updateDto = validateNadeEditBody(req);
      const preUpdateNade = await this.nadeService.getById(id);

      const updatedNade = await this.nadeService.update(id, updateDto, user);

      if (updatedNade) {
        const editingUser = await this.userService.byId(context, user.steamId);
        this.createAuditEntryNadeUpdate(
          {
            nickname: editingUser.nickname,
            avatar: editingUser.avatar,
            role: editingUser.role,
            steamId: editingUser.steamId,
          },
          preUpdateNade,
          updatedNade
        );
      }

      return res.status(202).send(updatedNade);
    } catch (error) {
      Logger.error(error);
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private incrementViewCount = async (req, res) => {
    try {
      const identifier = getSessionId(req);

      if (identifier) {
        return res.status(202).send();
      } else {
        return res.status(406).send();
      }
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private validateGfy = async (req, res) => {
    try {
      const validateGfycat = req.body as NadeGfycatValidateDto;

      const gfyDataResponse = await this.gfycatApi.getGfycatData(
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

  private deleteNade = async (req, res) => {
    try {
      const id = sanitizeIt(req.params.id);

      await this.nadeService.delete(id);

      return res.status(204).send();
    } catch (error) {
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private isSlug = (value: string) => {
    return value.includes("-");
  };

  private createAuditEntryNadeUpdate = (
    byUser: UserAudit,
    preUpdateNade: NadeDto,
    updatedNade: NadeDto
  ) => {
    const updatedField: string[] = [];

    if (preUpdateNade.endPosition !== updatedNade.endPosition) {
      updatedField.push("endPosition");
    }
    if (preUpdateNade.gfycat.gfyId !== updatedNade.gfycat.gfyId) {
      updatedField.push("gfycat");
    }
    if (preUpdateNade.images.lineupUrl !== updatedNade.images.lineupUrl) {
      updatedField.push("lineupImg");
    }
    if (preUpdateNade.images.thumbnailUrl !== updatedNade.images.thumbnailUrl) {
      updatedField.push("resultImg");
    }
    if (preUpdateNade.isPro !== updatedNade.isPro) {
      updatedField.push("isPro");
    }
    if (preUpdateNade.map !== updatedNade.map) {
      updatedField.push("map");
    }
    if (preUpdateNade.mapEndCoord?.x !== updatedNade.mapEndCoord?.x) {
      updatedField.push("mapEndCoord");
    } else if (preUpdateNade.mapEndCoord?.y !== updatedNade.mapEndCoord?.y) {
      updatedField.push("mapEndCoord");
    }
    if (preUpdateNade.movement !== updatedNade.movement) {
      updatedField.push("movement");
    }
    if (preUpdateNade.oneWay !== updatedNade.oneWay) {
      updatedField.push("oneWay");
    }
    if (preUpdateNade.status !== updatedNade.status) {
      updatedField.push("status");
    }
    if (preUpdateNade.technique !== updatedNade.technique) {
      updatedField.push("technique");
    }
    if (preUpdateNade.tickrate !== updatedNade.tickrate) {
      updatedField.push("tickrate");
    }
    if (preUpdateNade.type !== updatedNade.type) {
      updatedField.push("type");
    }
    if (preUpdateNade.description !== updatedNade.description) {
      updatedField.push("description");
    }
    if (preUpdateNade.endPosition !== updatedNade.endPosition) {
      updatedField.push("endPosition");
    }
    if (preUpdateNade.startPosition !== updatedNade.startPosition) {
      updatedField.push("startPosition");
    }

    if (updatedField.length === 0) {
      console.log("Update withouth change");
      return;
    }

    const auditEvent: CreateAuditDto = {
      byUser,
      name: "updateNade",
      description: `Nade updated with fields: ${updatedField.join(", ")}.`,
      onNadeId: updatedNade.id,
    };

    this.auditServer.createAuditEvent(auditEvent);
  };
}
