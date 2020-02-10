import Joi from "@hapi/joi";
import { NadeUpdateResultImageDto } from "./Nade";

export const validateNadeUpdateResultImage = (
  reqBody: NadeUpdateResultImageDto
): NadeUpdateResultImageDto => {
  const nadeUpdateResultImageSchema = Joi.object<NadeUpdateResultImageDto>({
    imageBase64: Joi.string()
      .base64()
      .required()
  }).unknown(false);

  const value = Joi.attempt(
    reqBody,
    nadeUpdateResultImageSchema
  ) as NadeUpdateResultImageDto;

  return value;
};
