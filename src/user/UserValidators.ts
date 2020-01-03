import joi from "joi";
import { ErrorFactory } from "../utils/ErrorUtil";
import { Request } from "express";
import { sanitizeIt } from "../utils/Sanitize";
import { UserUpdateDTO } from "./UserDTOs";

export const validateUserUpdateDTO = (req: Request): UserUpdateDTO => {
  const articleUpdateSchema = joi
    .object({
      nickname: joi.string().optional(),
      bio: joi.string().optional(),
      email: joi.string().optional(),
      createdAt: joi.string().optional()
    })
    .unknown(false);

  const { error } = joi.validate(req.body, articleUpdateSchema);

  if (error) {
    throw ErrorFactory.BadRequest(error.message);
  }

  const dto = sanitizeIt<UserUpdateDTO>(req.body);

  return dto;
};

export const validateSteamId = (req: Request): string => {
  const articleUpdateSchema = joi
    .object({
      steamId: joi.string().required()
    })
    .unknown(false);

  const { error } = joi.validate(req.params, articleUpdateSchema);

  if (error) {
    throw ErrorFactory.BadRequest(error.message);
  }

  const steamId = sanitizeIt<string>(req.params.steamId);

  return steamId;
};
