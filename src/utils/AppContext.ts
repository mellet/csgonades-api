import { Request } from "express";
import { RequestUser } from "./AuthUtils";
import { maybeUserFromRequest, userFromRequest } from "./RouterUtils";

export interface AppContext {
  authUser?: RequestUser;
}

interface AppContextAuth {
  authUser: RequestUser;
}

export function createAppContext(req: Request): AppContext {
  return {
    authUser: maybeUserFromRequest(req),
  };
}

export function createAppContextAuth(req: Request): AppContextAuth {
  return {
    authUser: userFromRequest(req),
  };
}
