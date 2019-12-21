import { Router } from "express";
import { CSGNConfig } from "../config/enironment";
import { IUserRepo } from "./UserRepo";
import { authenticateRoute } from "../utils/AuthUtils";
import { userFromRequest } from "../utils/RouterUtils";
import { userModelToDTO, desensitizeUser } from "./UserConverters";

export const makeUserRouter = (
  config: CSGNConfig,
  userRepo: IUserRepo
): Router => {
  const UserRouter = Router();

  UserRouter.get("/users/self", authenticateRoute, async (req, res) => {
    const requestUser = userFromRequest(req);

    const result = await userRepo.bySteamID(requestUser.steamId);

    if (result.isErr()) {
      const { error } = result;
      return res.status(500).send(error);
    }

    const userDto = userModelToDTO(result.value);

    return res.status(200).send(userDto);
  });

  UserRouter.get("/users/:id", async (req, res) => {
    const { id } = req.params; // TODO: Sanitze
    const requestUser = userFromRequest(req);

    const result = await userRepo.bySteamID(id);

    if (result.isErr()) {
      const { error } = result;
      return res.status(500).send(error);
    }

    const userModel = result.value;
    const userDto = userModelToDTO(userModel);
    const responseUser = desensitizeUser(userDto, requestUser);

    return res.status(200).send(responseUser);
  });

  UserRouter.get("/users", async (req, res) => {
    const result = await userRepo.all();

    if (result.isErr()) {
      const { error } = result;
      return res.status(500).send(error);
    }

    const { value } = result;

    return res.status(200).send(value);
  });

  return UserRouter;
};
