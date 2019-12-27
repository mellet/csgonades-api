import { Router } from "express";
import { FavoriteService } from "./FavoriteService";
import { authenticateRoute } from "../utils/AuthUtils";
import { userFromRequest } from "../utils/RouterUtils";
import { toFavoriteDTO } from "./Favorite";

export const makeFavoriteRouter = (
  favoriteService: FavoriteService
): Router => {
  const FavoriteRouter = Router();

  FavoriteRouter.get("/favorites", authenticateRoute, async (req, res) => {
    const user = userFromRequest(req);
    const result = await favoriteService.getFavoritesForUser(user.steamId);

    if (result.isErr()) {
      console.error(result.error);
      return res.status(result.error.status).send(result.error);
    }

    const favorites = result.value.map(toFavoriteDTO);

    return res.status(200).send(favorites);
  });

  FavoriteRouter.post(
    "/favorites/:nadeId",
    authenticateRoute,
    async (req, res) => {
      const user = userFromRequest(req);
      const nadeId = req.params.nadeId; // TODO: Sanitze

      const result = await favoriteService.createFavoriteForUser(
        user.steamId,
        nadeId
      );

      if (result.isErr()) {
        return res.status(result.error.status).send(result.error);
      }

      const favorite = toFavoriteDTO(result.value);

      return res.status(201).send(favorite);
    }
  );

  FavoriteRouter.delete(
    "/favorites/:favoriteId",
    authenticateRoute,
    async (req, res) => {
      const favoriteId = req.params.favoriteId; // TODO: Sanitze
      const user = userFromRequest(req);

      const result = await favoriteService.unFavorite(user.steamId, favoriteId);

      if (result.isErr()) {
        return res.status(result.error.status).send(result.error);
      }

      const wasDeleted = result.value;

      if (wasDeleted) {
        return res.status(202).send();
      }

      return res.status(500).send({
        status: 500,
        error: "Unknown error when unfavoriting"
      });
    }
  );

  return FavoriteRouter;
};
