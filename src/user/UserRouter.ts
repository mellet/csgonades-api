import { Router } from "express";
import { CSGNConfig } from "../config/enironment";
import { authenticateRoute } from "../utils/AuthUtils";
import { userFromRequest } from "../utils/RouterUtils";
import {
  userModelToDTO,
  desensitizeUser,
  userModelsToDTOs
} from "./UserConverters";
import { sanitizeIt } from "../utils/Sanitize";
import { UserUpdateDTO } from "./UserDTOs";
import { IUserService } from "./UserService";
import { NadeService } from "../nade/NadeService";

export const makeUserRouter = (
  config: CSGNConfig,
  userService: IUserService,
  nadeService: NadeService
): Router => {
  const UserRouter = Router();

  UserRouter.get("/users/self", authenticateRoute, async (req, res) => {
    const requestUser = userFromRequest(req);

    const result = await userService.bySteamID(requestUser.steamId);

    if (result.isErr()) {
      const { error } = result;
      return res.status(500).send(error);
    }

    const userDto = userModelToDTO(result.value);

    return res.status(200).send(userDto);
  });

  UserRouter.get("/users/:id", async (req, res) => {
    const id = sanitizeIt(req.params.id);
    const requestUser = userFromRequest(req);

    const result = await userService.bySteamID(id);

    if (result.isErr()) {
      const { error } = result;
      return res.status(500).send(error);
    }

    const userModel = result.value;
    const userDto = userModelToDTO(userModel);
    const responseUser = desensitizeUser(userDto, requestUser);

    return res.status(200).send(responseUser);
  });

  UserRouter.get("/users", async (_, res) => {
    const result = await userService.all();

    if (result.isErr()) {
      const { error } = result;
      return res.status(500).send(error);
    }

    const users = userModelsToDTOs(result.value);

    return res.status(200).send(users);
  });

  UserRouter.patch("/users/:steamId", authenticateRoute, async (req, res) => {
    const steamId = sanitizeIt(req.params.steamId);
    const requestUser = userFromRequest(req); // TODO: Check privileges for role and createdAt
    const userUpdateFields = req.body as UserUpdateDTO; // TODO: validate, sanitize

    // Disallow normal users to edit others than themself
    if (requestUser.role === "user" && requestUser.steamId !== steamId) {
      return res.status(403).send({ status: 403, message: "Forbidden" });
    }

    const result = await userService.updateUser(steamId, userUpdateFields);

    if (result.isErr()) {
      return res.status(500).send(result.error);
    }

    const user = userModelToDTO(result.value);

    // Update all nades by user if nickname changed
    if (userUpdateFields.nickname !== user.nickname) {
      console.log("Propagating nickname change");
      await nadeService.updateNadesWithUser(user.steamID, {
        nickname: user.nickname,
        avatar: user.avatar,
        steamId: user.steamID
      });
    }

    return res.status(202).send(user);
  });

  return UserRouter;
};
