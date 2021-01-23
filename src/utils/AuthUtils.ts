import jwt from "jsonwebtoken";
import { CSGNConfig } from "../config/enironment";
import { Role, UserModel } from "../user/UserModel";
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
      role: user.role,
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
      role: user.role,
    },
    secret,
    {
      expiresIn: "15m",
    }
  );
  return token;
};

export const payloadFromToken = (secret: string, token: string): JWTPayload => {
  const decoded = jwt.verify(token, secret) as JWTPayload;
  return decoded;
};

export const authOnlyHandler = (req, res, next) => {
  const user = userFromRequest(req);
  if (!user || !(user && user.role) || !(user && user.steamId)) {
    return res.status(401).send({
      error: "Access denied. No user detected.",
    });
  }
  next();
};

export const adminOrModHandler = (req, res, next) => {
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

export const adminOnlyHandler = (req, res, next) => {
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

export const extractTokenMiddleware = (config: CSGNConfig) => {
  return (req, res, next) => {
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

export const isEntityOwnerOrPrivilegedUser = (
  entityOwnerId: string,
  user: RequestUser
) => {
  if (user.role === "administrator" || user.role === "moderator") {
    return true;
  }
  if (entityOwnerId === user.steamId) {
    return true;
  }
  return false;
};
