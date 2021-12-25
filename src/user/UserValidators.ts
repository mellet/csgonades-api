import Joi from "@hapi/joi";
import { Request } from "express-serve-static-core";
import { nadeValidTickrate } from "../nade/nadeSubTypes/Tickrate";
import { sanitizeIt } from "../utils/Sanitize";
import { UserUpdateDto } from "./UserDTOs";

export const validateUserUpdateDTO = (req: Request): UserUpdateDto => {
  const body = req.body as UserUpdateDto;
  const articleUpdateSchema = Joi.object<UserUpdateDto>({
    nickname: Joi.string().optional(),
    bio: Joi.string().allow("").optional(),
    email: Joi.string().allow("").optional(),
    createdAt: Joi.string().optional(),
    defaultTick: Joi.string()
      .valid(...nadeValidTickrate())
      .optional(),
  }).unknown(false);

  const value = Joi.attempt(body, articleUpdateSchema) as UserUpdateDto;

  const dto = sanitizeIt<UserUpdateDto>(value);

  return dto;
};

type SteamIdReqParam = {
  steamId: string;
};

export const validateSteamId = (req: Request): SteamIdReqParam => {
  const articleUpdateSchema = Joi.object({
    steamId: Joi.string().required(),
  }).unknown(false);

  const value = Joi.attempt(req.params, articleUpdateSchema) as SteamIdReqParam;

  const steamId = sanitizeIt<SteamIdReqParam>(value);

  return steamId;
};
