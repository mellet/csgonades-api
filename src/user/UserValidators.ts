import Joi from "@hapi/joi";
import { Request } from "express";
import { sanitizeIt } from "../utils/Sanitize";
import { UserUpdateDTO } from "./UserDTOs";

export const validateUserUpdateDTO = (req: Request): UserUpdateDTO => {
  const body = req.body as UserUpdateDTO;
  const articleUpdateSchema = Joi.object<UserUpdateDTO>({
    nickname: Joi.string().optional(),
    bio: Joi.string().optional(),
    email: Joi.string().optional(),
    createdAt: Joi.string().optional()
  }).unknown(false);

  const value = Joi.attempt(body, articleUpdateSchema) as UserUpdateDTO;

  const dto = sanitizeIt<UserUpdateDTO>(value);

  return dto;
};

export const validateSteamId = (req: Request): string => {
  const articleUpdateSchema = Joi.object({
    steamId: Joi.string().required()
  }).unknown(false);

  const value = Joi.attempt(req.params, articleUpdateSchema) as string;

  const steamId = sanitizeIt<string>(value);

  return steamId;
};
