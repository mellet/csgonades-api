import * as Sentry from "@sentry/node";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Logger } from "../logger/Logger";
import { createAppContext } from "../utils/AppContext";
import { adminOrModHandler, authOnlyHandler } from "../utils/AuthHandlers";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { UserFilter } from "./repository/UserFireRepo";
import { UserService } from "./UserService";
import { validateSteamId, validateUserUpdateDTO } from "./UserValidators";

export const makeUserRouter = (userService: UserService): Router => {
  const UserRouter = Router();

  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 2,
    onLimitReached: (req) => {
      console.log("> /users/self request limit reached", req.rateLimit.current);
    },
  });

  UserRouter.get("/users/self", authOnlyHandler, limiter, async (req, res) => {
    try {
      const context = createAppContext(req);

      const user = await userService.byId(context, context.authUser!.steamId);

      return res.status(200).send(user);
    } catch (error) {
      Logger.error(error);
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  UserRouter.get("/users/:steamId", async (req, res) => {
    try {
      const { steamId } = validateSteamId(req);
      const context = createAppContext(req);

      const user = await userService.byId(context, steamId);

      return res.status(200).send(user);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  UserRouter.get("/users", adminOrModHandler, async (req, res) => {
    try {
      const { limit, page, sortActive } = req.query;

      const userFilter: UserFilter = {
        byActivity: sortActive === "true",
        limit: limit ? Number(limit) : undefined,
        page: page ? Number(page) : undefined,
      };

      const users = await userService.all(userFilter);

      return res.status(200).send(users);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  UserRouter.patch("/users/:steamId", authOnlyHandler, async (req, res) => {
    try {
      const { steamId } = validateSteamId(req);
      const userUpdateFields = validateUserUpdateDTO(req);
      const context = createAppContext(req);

      const user = await userService.update(context, steamId, userUpdateFields);

      return res.status(202).send(user);
    } catch (error) {
      Logger.error(error);
      Sentry.captureException(error);

      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  return UserRouter;
};
