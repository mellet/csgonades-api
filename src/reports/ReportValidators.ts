import Joi from "@hapi/joi";
import { Request } from "express-serve-static-core";
import { sanitizeIt } from "../utils/Sanitize";
import { ReportSaveDto } from "./Report";

export const validateReportSaveDTO = (req: Request): ReportSaveDto => {
  const body = req.body as ReportSaveDto;

  const schema = Joi.object<ReportSaveDto>({
    nadeId: Joi.string().required(),
    message: Joi.string().required(),
  }).unknown(false);

  const value = Joi.attempt(body, schema) as ReportSaveDto;

  return value;
};

export const validateReportId = (req: Request): string => {
  const schema = Joi.object({
    reportId: Joi.string().required(),
  }).unknown(false);

  const value = Joi.attempt(req.params, schema);
  const reportId = sanitizeIt<string>(value.reportId);

  return reportId;
};
