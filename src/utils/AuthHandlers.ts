import { NextFunction, Request, Response } from "express";
import { CSGNConfig } from "../config/enironment";
import { payloadFromToken, RequestUser } from "./AuthUtils";
import { userFromRequest } from "./RouterUtils";

export const extractTokenMiddleware = (config: CSGNConfig) => {
  return (req: Request, _: Response, next: NextFunction) => {
    const token = (req.headers["x-access-token"] ||
      req.headers["authorization"]) as string;
    if (token) {
      try {
        const decoded = payloadFromToken(config.secrets.server_key, token);
        const requestUser: RequestUser = {
          steamId: decoded.steamId,
          role: decoded.role,
        };
        req.user = requestUser;
      } catch (error) {
        console.warn(
          "Expired or invalid access token in request",
          error.message
        );
      }
    }

    const csgonadestoken =
      req.signedCookies &&
      (req.signedCookies.csgonadestoken as string | undefined);

    if (csgonadestoken) {
      try {
        const decoded = payloadFromToken(
          config.secrets.server_key,
          csgonadestoken
        );
        const requestUser: RequestUser = {
          steamId: decoded.steamId,
          role: decoded.role,
        };
        req.user = requestUser;
      } catch (error) {
        console.warn(
          "Expired or invalid refresh token in request",
          error.message
        );
      }
    }
    next();
  };
};

export const authOnlyHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = userFromRequest(req);
  if (!user || !(user && user.role) || !(user && user.steamId)) {
    return res.status(401).send({
      error: "Access denied. No user detected.",
    });
  }
  next();
};

export const adminOrModHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = userFromRequest(req);
  if (!user) {
    return res.status(401).send({
      error: "Access denied. No user detected.",
    });
  }

  if (user.role === "user") {
    return res.status(403).send({
      error: "Only allowed by admin or moderator.",
    });
  }

  next();
};

export const adminOnlyHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = userFromRequest(req);
  if (!user) {
    return res.status(401).send({
      error: "Access denied. No user detected.",
    });
  }

  if (user.role !== "administrator") {
    return res.status(403).send({
      error: "Only allowed by admin.",
    });
  }

  next();
};
