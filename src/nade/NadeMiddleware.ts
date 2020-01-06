import { NextFunction, Response, Request } from "express";
import Joi from "@hapi/joi";

export const validateNade = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const nadeBodySchema = Joi.object({
    gfycatIdOrUrl: Joi.string().required(),
    imageBase64: Joi.string().required()
  }).unknown(false);

  try {
    Joi.attempt(req.body, nadeBodySchema);
  } catch (error) {
    return res.status(400).send(error);
  }

  next();
};

export const ValidateUpdateNade = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const nadeBodySchema = Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    gfycatIdOrUrl: Joi.string(),
    map: Joi.string(),
    movement: Joi.string(),
    technique: Joi.string(),
    tickrate: Joi.string(),
    steamId: Joi.string(),
    status: Joi.string(),
    statusInfo: Joi.string()
  }).unknown(false);

  try {
    Joi.attempt(req.body, nadeBodySchema);
  } catch (error) {
    return res.status(400).send(error);
  }

  next();
};
