import jwt from "jsonwebtoken";
import { Role, UserModel } from "../user/UserModel";
import { NextFunction, Response, Request } from "express";
import { CSGNConfig } from "../config/enironment";
import { userFromRequest } from "./RouterUtils";

type JWTPayload = {
  exp: number;
  iat: number;
  steamId: string;
  role: Role;
};

export type RequestUser = {
  steamId: string;
  role: Role;
};

export const createRefreshToken = (secret: string, user: UserModel): string => {
  const token = jwt.sign(
    {
      steamId: user.steamId,
      role: user.role
    },
    secret,
    { expiresIn: "30d" }
  );
  return token;
};

export const createAccessToken = (secret: string, user: UserModel): string => {
  const token = jwt.sign(
    {
      steamId: user.steamId,
      role: user.role
    },
    secret,
    {
      expiresIn: "15m"
    }
  );
  return token;
};

export const payloadFromToken = (secret: string, token: string): JWTPayload => {
  const decoded = jwt.verify(token, secret) as JWTPayload;
  return decoded;
};

export const authOnlyHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = userFromRequest(req);
  if (!user || !(user && user.role) || !(user && user.steamId)) {
    return res.status(401).send({
      error: "Access denied. No user detected."
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
      error: "Access denied. No user detected."
    });
  }

  if (user.role === "user") {
    return res.status(403).send({
      error: "Only allowed by admin or moderator."
    });
  }

  next();
};

export const extractTokenMiddleware = (config: CSGNConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = (req.headers["x-access-token"] ||
      req.headers["authorization"]) as string;
    if (token) {
      try {
        const decoded = payloadFromToken(config.secrets.server_key, token);
        const requestUser: RequestUser = {
          steamId: decoded.steamId,
          role: decoded.role
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
          role: decoded.role
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
