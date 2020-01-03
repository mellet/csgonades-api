import { Router } from "express";
import { FavoriteService } from "./FavoriteService";
import { authenticateRoute } from "../utils/AuthUtils";
import { userFromRequest } from "../utils/RouterUtils";
import { sanitizeIt } from "../utils/Sanitize";
import { errorCatchConverter } from "../utils/ErrorUtil";

export const makeFavoriteRouter = (
  favoriteService: FavoriteService
): Router => {
  const FavoriteRouter = Router();

  FavoriteRouter.get("/favorites", authenticateRoute, async (req, res) => {
    try {
      const user = userFromRequest(req);
      const favorites = await favoriteService.getFavoritesForUser(user.steamId);

      return res.status(200).send(favorites);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  FavoriteRouter.post(
    "/favorites/:nadeId",
    authenticateRoute,
    async (req, res) => {
      try {
        const user = userFromRequest(req);
        const nadeId = sanitizeIt(req.params.nadeId);

        const favorite = await favoriteService.createFavoriteForUser(
          user.steamId,
          nadeId
        );

        return res.status(201).send(favorite);
      } catch (error) {
        const err = errorCatchConverter(error);
        return res.status(err.code).send(err);
      }
    }
  );

  FavoriteRouter.delete(
    "/favorites/:favoriteId",
    authenticateRoute,
    async (req, res) => {
      try {
        const favoriteId = sanitizeIt(req.params.favoriteId);
        const user = userFromRequest(req);

        await favoriteService.unFavorite(user.steamId, favoriteId);

        return res.status(202).send();
      } catch (error) {
        const err = errorCatchConverter(error);
        return res.status(err.code).send(err);
      }
    }
  );

  return FavoriteRouter;
};
