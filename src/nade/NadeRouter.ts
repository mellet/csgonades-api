import { RequestHandler, Router } from "express";
import { AuditService } from "../audit/AuditService";
import { CreateAuditDto } from "../audit/dto/CreateAuditDto";
import { UserAudit } from "../audit/dto/UserAudit";
import { CommentService } from "../comment/CommentService";
import { Logger } from "../logger/Logger";
import { UserService } from "../user/UserService";
import { createAppContext } from "../utils/AppContext";
import { adminOrModHandler, authOnlyHandler } from "../utils/AuthHandlers";
import { ErrorFactory } from "../utils/ErrorUtil";
import { maybeUserFromRequest, userFromRequest } from "../utils/RouterUtils";
import { sanitizeIt } from "../utils/Sanitize";
import { getSessionId } from "../utils/SessionRoute";
import { NadeService } from "./NadeService";
import { NadeDto } from "./dto/NadeDto";
import { CsMap } from "./nadeSubTypes/CsgoMap";
import { GameMode } from "./nadeSubTypes/GameMode";
import { NadeType } from "./nadeSubTypes/NadeType";
import { TeamSide } from "./nadeSubTypes/TeamSide";
import { Tickrate } from "./nadeSubTypes/Tickrate";
import {
  validateEloGameBody,
  validateNadeCreateBody,
  validateNadeEditBody,
} from "./utils/NadeValidators";

type NadeRouterServices = {
  nadeService: NadeService;
  auditService: AuditService;
  userService: UserService;
  commentService: CommentService;
};

export class NadeRouter {
  private router: Router;
  private nadeService: NadeService;
  private auditService: AuditService;
  private userService: UserService;

  constructor(services: NadeRouterServices) {
    this.nadeService = services.nadeService;
    this.auditService = services.auditService;
    this.userService = services.userService;
    this.router = Router();
    this.setUpRoutes();
  }

  getRouter = (): Router => {
    return this.router;
  };

  private setUpRoutes = () => {
    this.router.get("/nademap/:map", this.getLocationsByMap);
    this.router.get(
      "/nades/start/:start/end/:end",
      this.getNadesByStartAndEndLocation
    );
    this.router.get("/nades", this.getNades);
    this.router.get("/nades/pending", adminOrModHandler, this.getPendingNades);
    this.router.get(
      "/nades/declined",
      adminOrModHandler,
      this.getDeclinedNades
    );
    this.router.get("/nades/deleted", adminOrModHandler, this.getDeletedNades);

    this.router.get("/nades/:id", this.getById);
    this.router.get("/nades/map/:mapname", this.getByMap);
    this.router.get("/nades/user/:steamId", this.getByUser);
    this.router.post("/nades", authOnlyHandler, this.addNade);
    this.router.put("/nades/:id", authOnlyHandler, this.updateNade);
    this.router.post("/nades/:id/countView", this.incrementViewCount);
    this.router.delete("/nades/:id", authOnlyHandler, this.deleteNade);
    this.router.get("/nades/:id/checkslug", this.checkSlug);

    // Favorite routes
    this.router.post("/nades/:id/favorite", authOnlyHandler, this.favorite);
    this.router.delete("/nades/:id/favorite", authOnlyHandler, this.unFavorite);

    // Elo game routes
    this.router.post("/nades/elogame", this.scoreGame);

    // Contributors
    this.router.get("/nades/contributors/:csMap", this.getMapContributors);

    // Moderator routes
    this.router.get(
      "/admin/uncompleteNades",
      adminOrModHandler,
      this.getFlaggedNades
    );
  };

  private getMapContributors: RequestHandler = async (req, res) => {
    const csMap = sanitizeIt(req.params.csMap) as CsMap;
    const gameMode = sanitizeIt(req?.query?.gameMode) as GameMode;

    if (!csMap || !gameMode) {
      return res.status(400).send();
    }

    const constributors = await this.nadeService.getNadeContributors(
      csMap,
      gameMode
    );

    return res.status(200).send(constributors);
  };

  private getNadesByStartAndEndLocation: RequestHandler = async (req, res) => {
    const start = sanitizeIt<string>(req.params.start);
    const end = sanitizeIt<string>(req.params.end);
    if (!start || !end) {
      return res.status(400).send();
    }

    const result = await this.nadeService.getByStartAndEndLocation(start, end);

    return res.status(200).send(result);
  };

  private getLocationsByMap: RequestHandler = async (req, res) => {
    const csMap = sanitizeIt(req.params.map) as CsMap;
    const nadeType = sanitizeIt(req?.query?.nadeType) as NadeType;
    const gameMode = sanitizeIt(req?.query?.gameMode) as GameMode;
    const tickRate = sanitizeIt(req?.query?.tickRate) as Tickrate;
    const teamSide = sanitizeIt(req?.query?.teamSide) as TeamSide;
    const showFavorites = sanitizeIt(req?.query?.favorites);
    const user = maybeUserFromRequest(req);

    if (!gameMode || !csMap || !nadeType) {
      return res.status(400).send();
    }

    const filter = {
      csMap,
      gameMode,
      nadeType,
      teamSide,
      tickRate,
      showFavorites: showFavorites === "1" ? true : false,
    };

    const result = await this.nadeService.getLocationsByMap(
      filter,
      user?.steamId
    );

    res.status(200).send(result);
  };

  private getFlaggedNades: RequestHandler = async (_, res) => {
    const nades = await this.nadeService.getFlagged();

    return res.status(200).send(nades);
  };

  private favorite: RequestHandler = async (req, res) => {
    const user = userFromRequest(req);
    const nadeId = sanitizeIt(req.params.id);

    if (!user || !user.steamId) {
      Logger.warning("NadeRouter.favorite Not signed in");
      throw ErrorFactory.Forbidden("Not signed in");
    }

    if (!nadeId) {
      Logger.error("NadeRouter.favorite No nade selected");
      throw ErrorFactory.BadRequest("Not signed in or no nade selected");
    }

    const favorite = await this.nadeService.favoriteNade(nadeId, user.steamId);

    return res.status(201).send(favorite);
  };

  private unFavorite: RequestHandler = async (req, res) => {
    const user = userFromRequest(req);
    const nadeId = sanitizeIt(req.params.id);

    if (!user || !user.steamId) {
      Logger.error("NadeRouter.unFavorite Not signed in");
      throw ErrorFactory.Forbidden("Not signed in");
    }

    if (!nadeId) {
      Logger.error("NadeRouter.unFavorite No nade selected");
      throw ErrorFactory.BadRequest("Not signed in or no nade selected");
    }

    await this.nadeService.unFavoriteNade(nadeId, user.steamId);

    return res.status(204).send();
  };

  private checkSlug: RequestHandler = async (req, res) => {
    const slug = sanitizeIt(req.params.id);
    const slugIsFree = await this.nadeService.isSlugAvailable(slug);

    return res.status(200).send(slugIsFree);
  };

  private getNades: RequestHandler = async (req, res) => {
    const gameMode = (sanitizeIt(req?.query?.gameMode) || "csgo") as GameMode;

    const nades = await this.nadeService.getRecent(gameMode);

    return res.status(200).send(nades);
  };

  private getPendingNades: RequestHandler = async (_, res) => {
    const pendingNades = await this.nadeService.getPending();

    return res.status(200).send(pendingNades);
  };

  private getDeclinedNades: RequestHandler = async (_, res) => {
    const declinedNades = await this.nadeService.getDeclined();

    return res.status(200).send(declinedNades);
  };

  private getDeletedNades: RequestHandler = async (_, res) => {
    const declinedNades = await this.nadeService.getDeleted();

    return res.status(200).send(declinedNades);
  };

  private getById: RequestHandler = async (req, res) => {
    const id = sanitizeIt(req.params.id);

    let nade: NadeDto | null = null;

    if (this.isSlug(id)) {
      nade = await this.nadeService.getBySlug(id);
    } else {
      nade = await this.nadeService.getById(id);
    }

    if (!nade) {
      return res.status(404).send();
    }

    return res.status(200).send(nade);
  };

  private getByMap: RequestHandler = async (req, res) => {
    const type = sanitizeIt(req.query.type) as NadeType | undefined;
    const gameMode = (sanitizeIt(req?.query?.gameMode) || "csgo") as GameMode;
    const mapName = sanitizeIt(req.params.mapname) as CsMap;
    const nades = await this.nadeService.getByMap(mapName, type, gameMode);

    return res.status(200).send(nades);
  };

  private getByUser: RequestHandler = async (req, res) => {
    const csgoMap = sanitizeIt(req.query.map) as CsMap | undefined;
    const steamId = sanitizeIt(req.params.steamId);
    const gameMode = (sanitizeIt(req?.query?.gameMode) || "csgo") as GameMode;
    const nades = await this.nadeService.getByUser(steamId, csgoMap, gameMode);

    return res.status(200).send(nades);
  };

  private addNade: RequestHandler = async (req, res) => {
    const user = userFromRequest(req);
    const nadeBody = validateNadeCreateBody(req);
    const nade = await this.nadeService.save(nadeBody, user.steamId);

    return res.status(201).send(nade);
  };

  private scoreGame: RequestHandler = async (req, res) => {
    const eloGame = validateEloGameBody(req);

    this.nadeService.performNadeComparison(eloGame);

    return res.status(201).send();
  };

  private updateNade: RequestHandler = async (req, res) => {
    const id = sanitizeIt(req.params.id);
    const context = createAppContext(req);
    const user = userFromRequest(req);
    const updateDto = validateNadeEditBody(req);
    const preUpdateNade = await this.nadeService.getById(id);

    if (!preUpdateNade) {
      return res.status(404).send();
    }

    const editingUser = await this.userService.byId(context, user.steamId);

    if (!editingUser) {
      throw ErrorFactory.NotFound("No user found to update nade");
    }

    const updatedNade = await this.nadeService.update(id, updateDto, user);

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

    return res.status(202).send(updatedNade);
  };

  private incrementViewCount: RequestHandler = async (req, res) => {
    const identifier = getSessionId(req);

    if (identifier) {
      return res.status(202).send();
    } else {
      return res.status(406).send();
    }
  };

  private deleteNade: RequestHandler = async (req, res) => {
    const nadeId = sanitizeIt(req.params.id);
    const user = userFromRequest(req);

    if (!user || !user.steamId) {
      Logger.error("NadeRouter.deleteNade Not signed in");
      throw ErrorFactory.Forbidden("Not signed in");
    }

    if (!nadeId) {
      Logger.error("NadeRouter.deleteNade No nade selected");
      throw ErrorFactory.BadRequest("Not signed in or no nade selected");
    }

    await this.nadeService.delete(nadeId, user);

    return res.status(204).send();
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

    if (preUpdateNade.description !== updatedNade.description) {
      updatedField.push("description");
    }
    if (preUpdateNade.endPosition !== updatedNade.endPosition) {
      updatedField.push("endPosition");
    }
    if (preUpdateNade.gameMode !== updatedNade.gameMode) {
      updatedField.push("gameMode");
    }
    if (preUpdateNade.youTubeId !== updatedNade.youTubeId) {
      updatedField.push("youtube");
    }
    if (preUpdateNade.images.lineup.small !== updatedNade.images.lineup.small) {
      updatedField.push("lineupImg");
    }
    if (preUpdateNade.images.result.small !== updatedNade.images.result.small) {
      updatedField.push("resultImg");
    }
    if (preUpdateNade.isPro !== updatedNade.isPro) {
      updatedField.push("isPro");
    }
    if (preUpdateNade.map !== updatedNade.map) {
      updatedField.push("map");
    }
    if (preUpdateNade.mapStartLocationId !== updatedNade.mapStartLocationId) {
      updatedField.push("mapStartLocationId");
    }
    if (preUpdateNade.mapEndLocationId !== updatedNade.mapEndLocationId) {
      updatedField.push("mapEndLocationId");
    }
    if (preUpdateNade.movement !== updatedNade.movement) {
      updatedField.push("movement");
    }
    if (preUpdateNade.oneWay !== updatedNade.oneWay) {
      updatedField.push("oneWay");
    }
    if (preUpdateNade.proUrl !== updatedNade.proUrl) {
      updatedField.push("proUrl");
    }
    if (preUpdateNade.setPos !== updatedNade.setPos) {
      updatedField.push("setPos");
    }
    if (preUpdateNade.startPosition !== updatedNade.startPosition) {
      updatedField.push("startPosition");
    }
    if (preUpdateNade.status !== updatedNade.status) {
      updatedField.push("status");
    }
    if (preUpdateNade.teamSide !== updatedNade.teamSide) {
      updatedField.push("teamSide");
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

    if (updatedField.length === 0) {
      return;
    }

    const auditEvent: CreateAuditDto = {
      byUser,
      name: "updateNade",
      description: `Nade updated with fields: ${updatedField.join(", ")}.`,
      onNadeId: updatedNade.id,
    };

    this.auditService.createAuditEvent(auditEvent);
  };
}
