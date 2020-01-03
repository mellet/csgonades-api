import { Router } from "express";
import { authenticateRoute, RequestUser } from "../utils/AuthUtils";
import { userFromRequest } from "../utils/RouterUtils";
import { NadeService } from "../nade/NadeService";
import { UserService } from "./UserService";
import { errorCatchConverter, ErrorFactory } from "../utils/ErrorUtil";
import { validateUserUpdateDTO, validateSteamId } from "./UserValidators";

export const makeUserRouter = (
  userService: UserService,
  nadeService: NadeService
): Router => {
  const UserRouter = Router();

  UserRouter.get("/users/self", authenticateRoute, async (req, res) => {
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
      const steamId = validateSteamId(req);
      const requestUser = userFromRequest(req);

      const isAdminOrMod =
        requestUser?.role === "administrator" ||
        requestUser?.role === "moderator";
      const isRequestingSelf = requestUser?.steamId === steamId;

      if (isAdminOrMod || isRequestingSelf) {
        const result = await userService.byId(steamId);

        return res.status(200).send(result);
      }

      const result = await userService.byIdAnon(steamId);
      return res.status(200).send(result);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  UserRouter.get("/users", async (_, res) => {
    try {
      const users = await userService.all();

      return res.status(200).send(users);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  });

  UserRouter.patch("/users/:steamId", authenticateRoute, async (req, res) => {
    try {
      const steamId = validateSteamId(req);
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
