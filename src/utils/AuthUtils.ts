import jwt from "jsonwebtoken";
import { Role, UserModel } from "../user/UserModel";

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

export const isEntityOwnerOrPrivilegedUser = (
  entityOwnerId: string,
  user?: RequestUser
) => {
  if (!user) {
    return false;
  }
  if (user.role === "administrator" || user.role === "moderator") {
    return true;
  }
  if (entityOwnerId === user.steamId) {
    return true;
  }
  return false;
};
