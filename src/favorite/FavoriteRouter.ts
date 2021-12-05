import * as Sentry from "@sentry/node";
import { RequestHandler, Router } from "express";
import { Logger } from "../logger/Logger";
import { authOnlyHandler } from "../utils/AuthHandlers";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { userFromRequest } from "../utils/RouterUtils";
import { sanitizeIt } from "../utils/Sanitize";
import { FavoriteService } from "./FavoriteService";

type FavoriteServices = {
  favoriteService: FavoriteService;
};

export class FavoriteRouter {
  private router: Router;
  private favoriteService: FavoriteService;

  constructor(services: FavoriteServices) {
    this.favoriteService = services.favoriteService;
    this.router = Router();
    this.setUpRoutes();
  }

  getRouter = (): Router => {
    return this.router;
  };

  private setUpRoutes = () => {
    this.router.get("/favorites", authOnlyHandler, this.getFavorites);
    this.router.post("/favorites/:nadeId", authOnlyHandler, this.addFavorite);
    this.router.delete(
      "/favorites/:favoriteId",
      authOnlyHandler,
      this.removeFavorite
    );
  };

  private getFavorites: RequestHandler = async (req, res) => {
    try {
      const user = userFromRequest(req);
      const favorites = await this.favoriteService.getFavoritesForUser(
        user.steamId
      );
      Logger.verbose("FavoriteRouter.getFavorites", favorites.length);

      return res.status(200).send(favorites);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private addFavorite: RequestHandler = async (req, res) => {
    try {
      const user = userFromRequest(req);
      const nadeId = sanitizeIt(req.params.nadeId);

      const favorite = await this.favoriteService.addFavorite(
        user.steamId,
        nadeId
      );

      Logger.verbose("FavoriteRouter.addFavorite", nadeId);

      return res.status(201).send(favorite);
    } catch (error) {
      Logger.error(error);
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private removeFavorite: RequestHandler = async (req, res) => {
    try {
      const favoriteId = sanitizeIt(req.params.favoriteId);
      const user = userFromRequest(req);

      await this.favoriteService.removeFavorite(user.steamId, favoriteId);

      Logger.verbose("FavoriteRouter.removeFavorite", favoriteId);

      return res.status(202).send();
    } catch (error) {
      Logger.error(error);
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };
}
