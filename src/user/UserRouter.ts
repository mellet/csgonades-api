import { Router } from "express";
import { NadeService } from "../nade/NadeService";
import {
  adminOrModHandler,
  authOnlyHandler,
  RequestUser
} from "../utils/AuthUtils";
import { errorCatchConverter, ErrorFactory } from "../utils/ErrorUtil";
import { maybeUserFromRequest, userFromRequest } from "../utils/RouterUtils";
import { UserFilter } from "./UserRepo";
import { UserService } from "./UserService";
import { validateSteamId, validateUserUpdateDTO } from "./UserValidators";

export const makeUserRouter = (
  userService: UserService,
  nadeService: NadeService
): Router => {
  const UserRouter = Router();

  UserRouter.get("/users/self", authOnlyHandler, async (req, res) => {
    try {
      const requestUser = userFromRequest(req);
      const user = await userService.byId(requestUser.steamId);

      return res.status(200).send(user);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  UserRouter.get("/users/:steamId", async (req, res) => {
    try {
      const { steamId } = validateSteamId(req);
      const requestUser = maybeUserFromRequest(req);

      const isAdminOrMod =
        requestUser?.role === "administrator" ||
        requestUser?.role === "moderator";
      const isRequestingSelf = requestUser?.steamId === steamId;

      if (isAdminOrMod || isRequestingSelf) {
        const user = await userService.byId(steamId);

        return res.status(200).send(user);
      }

      const result = await userService.byIdAnon(steamId);

      return res.status(200).send(result);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  UserRouter.get("/users", adminOrModHandler, async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const page = req.query.page ? Number(req.query.page) : undefined;
      const sortActive = req.query.sortActive === "true";

      const userFilter: UserFilter = {
        byActivity: sortActive,
        limit,
        page
      };

      const users = await userService.all(userFilter);

      return res.status(200).send(users);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  UserRouter.patch("/users/:steamId", authOnlyHandler, async (req, res) => {
    try {
      const { steamId } = validateSteamId(req);
      const requestUser = userFromRequest(req); // TODO: Check privileges for role and createdAt
      const userUpdateFields = validateUserUpdateDTO(req);

      checkUserUpdatePrivileges(requestUser, steamId);

      const user = await userService.update(steamId, userUpdateFields);

      if (!user) {
        return res.status(400).send({
          status: 400,
          message: "No user found"
        });
      }

      await nadeService.updateNadesWithUser(user.steamId, {
        nickname: user.nickname,
        avatar: user.avatar,
        steamId: user.steamId
      });

      return res.status(202).send(user);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  return UserRouter;
};

function checkUserUpdatePrivileges(requestUser: RequestUser, steamId: string) {
  if (requestUser.role === "user" && requestUser.steamId !== steamId) {
    throw ErrorFactory.Forbidden("You can't update this user");
  }
}
