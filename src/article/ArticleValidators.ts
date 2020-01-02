import joi from "joi";
import { ErrorFactory } from "../utils/ErrorUtil";
import { ArticleUpdateDTO, ArticleCreateDTO } from "./Article";
import { Request } from "express";
import { sanitizeIt } from "../utils/Sanitize";

export const validateArticleUpdateDTO = (req: Request): ArticleUpdateDTO => {
  const articleUpdateSchema = joi
    .object({
      title: joi.string().optional(),
      body: joi.string().optional(),
      status: joi.string().optional()
    })
    .unknown(false);

  const { error } = joi.validate(req.body, articleUpdateSchema);

  if (error) {
    throw ErrorFactory.BadRequest(error.message);
  }

  const dto = sanitizeIt<ArticleUpdateDTO>(req.body);

  return dto;
};

export const validateArticleCreateDTO = (req: Request): ArticleCreateDTO => {
  const articleUpdateSchema = joi
    .object({
      title: joi.string().required(),
      body: joi.string().required()
    })
    .unknown(false);

  const { error } = joi.validate(req.body, articleUpdateSchema);

  if (error) {
    throw ErrorFactory.BadRequest(error.message);
  }

  const dto = sanitizeIt<ArticleCreateDTO>(req.body);

  return dto;
};

export const validateArticleId = (req: Request): string => {
  const articleUpdateSchema = joi
    .object({
      articleId: joi.string().required()
    })
    .unknown(false);

  const { error } = joi.validate(req.params, articleUpdateSchema);

  if (error) {
    throw ErrorFactory.BadRequest(error.message);
  }

  const articleId = sanitizeIt<string>(req.params.articleId);

  return articleId;
};
