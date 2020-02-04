import Joi from "@hapi/joi";
import { Request } from "express";
import { sanitizeIt } from "../utils/Sanitize";
import { UserUpdateDTO } from "./UserDTOs";

export const validateUserUpdateDTO = (req: Request): UserUpdateDTO => {
  const body = req.body as UserUpdateDTO;
  const articleUpdateSchema = Joi.object<UserUpdateDTO>({
    nickname: Joi.string().optional(),
    bio: Joi.string()
      .allow("")
      .optional(),
    email: Joi.string()
      .allow("")
      .optional(),
    createdAt: Joi.string().optional()
  }).unknown(false);

  const value = Joi.attempt(body, articleUpdateSchema) as UserUpdateDTO;

  const dto = sanitizeIt<UserUpdateDTO>(value);

  return dto;
};

type SteamIdReqParam = {
  steamId: string;
};

export const validateSteamId = (req: Request): SteamIdReqParam => {
  const articleUpdateSchema = Joi.object({
    steamId: Joi.string().required()
  }).unknown(false);

  const value = Joi.attempt(req.params, articleUpdateSchema) as SteamIdReqParam;

  const steamId = sanitizeIt<SteamIdReqParam>(value);

  return steamId;
};
