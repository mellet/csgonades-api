import Joi from "@hapi/joi";
import { Request } from "express";
import { sanitizeIt } from "../utils/Sanitize";
import { ReportSaveDTO } from "./Report";

export const validateReportSaveDTO = (req: Request): ReportSaveDTO => {
  const body = req.body as ReportSaveDTO;

  const schema = Joi.object({
    nadeId: Joi.string().required(),
    message: Joi.string().required()
  }).unknown(false);

  const value = Joi.attempt(body, schema) as ReportSaveDTO;

  return value;
};

export const validateReportId = (req: Request): string => {
  const schema = Joi.object({
    reportId: Joi.string().required()
  }).unknown(false);

  const value = Joi.attempt(req.params, schema) as string;
  const reportId = sanitizeIt<string>(value);

  return reportId;
};
