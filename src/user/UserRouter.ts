import { Router } from "express";
import { CSGNConfig } from "../config/enironment";
import { UserRepo } from "./UserRepo";
import { authenticateRoute } from "../utils/AuthUtils";
import { userFromRequest } from "../utils/RouterUtils";

export const makeUserRouter = (
  config: CSGNConfig,
  userRepo: UserRepo
): Router => {
  const UserRouter = Router();

  UserRouter.get("/users/self", authenticateRoute, async (req, res) => {
    const requestUser = userFromRequest(req);

    try {
      const user = await userRepo.bySteamID(requestUser.steamId);
      return res.send(user);
    } catch (error) {
      return res.send({ error: error.message });
    }
  });

  return UserRouter;
};
