import jwt from "jsonwebtoken";
import { User } from "../user/User";
import { config } from "../config/enironment";

export const createRefreshToken = (user: User): string => {
  const token = jwt.sign(
    {
      user
    },
    config.secrets.server_key,
    { expiresIn: "30d" }
  );
  return token;
};

export const createAccessToken = (user: User): string => {
  const token = jwt.sign({ user }, config.secrets.server_key, {
    expiresIn: "15m"
  });
  return token;
};
