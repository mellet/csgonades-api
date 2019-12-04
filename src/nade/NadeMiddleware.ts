import { NextFunction, Response, Request } from "express";
import joi from "joi";

export const validateNade = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const nadeBodySchema = joi
    .object({
      gfycatIdOrUrl: joi.string().required(),
      imageBase64: joi.string().required(),
      title: joi.string(),
      description: joi.string(),
      map: joi.string(),
      movement: joi.string(),
      technique: joi.string(),
      tickrate: joi.string(),
      type: joi.string()
    })
    .unknown(false);

  const { error } = joi.validate(req.body, nadeBodySchema);
  if (error) {
    return res.status(400).send(error.message);
  }
  next();
};

export const ValidateUpdateNade = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const nadeBodySchema = joi
    .object({
      title: joi.string(),
      description: joi.string(),
      gfycatIdOrUrl: joi.string(),
      map: joi.string(),
      movement: joi.string(),
      technique: joi.string(),
      tickrate: joi.string(),
      steamId: joi.string(),
      status: joi.string(),
      statusInfo: joi.string()
    })
    .unknown(false);

  const { error } = joi.validate(req.body, nadeBodySchema);
  if (error) {
    return res.status(400).send(error.message);
  }
  next();
};
