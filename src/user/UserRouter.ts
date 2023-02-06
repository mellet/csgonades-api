import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Logger } from "../logger/Logger";
import {
  AppContext,
  createAppContext,
  createAppContextAuth,
} from "../utils/AppContext";
import { adminOrModHandler, authOnlyHandler } from "../utils/AuthHandlers";
import { ErrorFactory } from "../utils/ErrorUtil";
import { UserFilter } from "./repository/UserFireRepo";
import { UserService } from "./UserService";
import { validateSteamId, validateUserUpdateDTO } from "./UserValidators";

export const makeUserRouter = (userService: UserService): Router => {
  const UserRouter = Router();

  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10,
    onLimitReached: (_req) => {
      Logger.warning("UserRouter.self rate limit reached");
    },
  });

  UserRouter.get("/users/self", authOnlyHandler, limiter, async (req, res) => {
    const context = createAppContextAuth(req);

    const user = await userService.byId(context, context.authUser.steamId);

    if (!user) {
      return res.status(404).send();
    }

    return res.status(200).send(user);
  });

  UserRouter.get("/users/:steamId", async (req, res) => {
    const { steamId } = validateSteamId(req);
    const context = createAppContext(req);

    const user = await userService.byId(context, steamId);

    if (!user) {
      return res.status(404).send();
    }

    return res.status(200).send(user);
  });

  UserRouter.get("/users", adminOrModHandler, async (req, res) => {
    const { limit, page, sortActive } = req.query;

    const userFilter: UserFilter = {
      byActivity: sortActive === "true",
      limit: limit ? Number(limit) : undefined,
      page: page ? Number(page) : undefined,
    };

    const users = await userService.all(userFilter);

    return res.status(200).send(users);
  });

  UserRouter.patch("/users/:steamId", authOnlyHandler, async (req, res) => {
    const { steamId } = validateSteamId(req);
    const userUpdateFields = validateUserUpdateDTO(req);
    const context = createAppContext(req);

    validateAllowEdit(context, steamId);

    const user = await userService.update(steamId, userUpdateFields);

    return res.status(202).send(user);
  });

  return UserRouter;
};

function validateAllowEdit(context: AppContext, steamIdToBeEdited: string) {
  const isUpdatingSelf = steamIdToBeEdited === context.authUser?.steamId;
  const isPrivilegedUser = context.authUser?.role === "administrator";

  if (!isUpdatingSelf && !isPrivilegedUser) {
    Logger.warning("UserService.update - Forbidden");
    throw ErrorFactory.Forbidden("You are not allowed to edit this user");
  }
}
