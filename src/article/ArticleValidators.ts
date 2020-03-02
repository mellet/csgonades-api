import Joi from "@hapi/joi";
import { Request } from "express";
import { sanitizeIt } from "../utils/Sanitize";
import { ArticleCreateBodyDTO, ArticleUpdateDTO } from "./Article";

export const validateArticleUpdateDTO = (req: Request): ArticleUpdateDTO => {
  const body = req.body as ArticleUpdateDTO;
  const articleUpdateSchema = Joi.object<ArticleUpdateDTO>({
    title: Joi.string().optional(),
    body: Joi.string().optional(),
    status: Joi.string().optional()
  }).unknown(false);

  const value = Joi.attempt(body, articleUpdateSchema) as ArticleUpdateDTO;

  return value;
};

export const validateArticleCreateDTO = (
  req: Request
): ArticleCreateBodyDTO => {
  const body = req.body as ArticleCreateBodyDTO;
  const articleUpdateSchema = Joi.object({
    title: Joi.string().required(),
    body: Joi.string().required(),
    imageData: Joi.string().required()
  }).unknown(false);

  const value = Joi.attempt(body, articleUpdateSchema) as ArticleCreateBodyDTO;

  return value;
};

export const validateArticleId = (req: Request): string => {
  const articleUpdateSchema = Joi.object({
    articleId: Joi.string().required()
  }).unknown(false);

  const value = Joi.attempt(req.params, articleUpdateSchema) as string;
  const articleId = sanitizeIt<string>(value);

  return articleId;
};
