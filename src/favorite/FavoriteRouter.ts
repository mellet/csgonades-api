import { RequestHandler, Router } from "express";
import { authOnlyHandler } from "../utils/AuthHandlers";
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
    const user = userFromRequest(req);
    const favorites = await this.favoriteService.getFavoritesForUser(
      user.steamId
    );

    return res.status(200).send(favorites);
  };

  private addFavorite: RequestHandler = async (req, res) => {
    const user = userFromRequest(req);
    const nadeId = sanitizeIt(req.params.nadeId);

    const favorite = await this.favoriteService.addFavorite(
      user.steamId,
      nadeId
    );

    return res.status(201).send(favorite);
  };

  private removeFavorite: RequestHandler = async (req, res) => {
    const favoriteId = sanitizeIt(req.params.favoriteId);
    const user = userFromRequest(req);

    await this.favoriteService.removeFavorite(user.steamId, favoriteId);

    return res.status(202).send();
  };
}
