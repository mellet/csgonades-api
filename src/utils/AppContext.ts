import { Request } from "express";
import { RequestUser } from "./AuthUtils";
import { maybeUserFromRequest } from "./RouterUtils";

export interface AppContext {
  authUser?: RequestUser;
}

export function createAppContext(req: Request): AppContext {
  return {
    authUser: maybeUserFromRequest(req),
  };
}
