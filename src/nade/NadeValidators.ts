import Joi from "@hapi/joi";
import { Request } from "express";
import { NadeCreateDTO, NadeUpdateDTO } from "./Nade";

export const validateNadeCreateBody = (req: Request): NadeCreateDTO => {
  const body = req.body as NadeCreateDTO;
  const schema = Joi.object<NadeCreateDTO>({
    gfycat: Joi.object()
      .keys({
        gfyId: Joi.string(),
        smallVideoUrl: Joi.string().uri(),
        largeVideoUrl: Joi.string().uri(),
        largeVideoWebm: Joi.string().uri(),
        avgColor: Joi.string().optional(),
        duration: Joi.string().optional(),
      })
      .required(),
    imageBase64: Joi.string().required(),
    startPosition: Joi.string().required(),
    endPosition: Joi.string().required(),
    description: Joi.string().required(),
    map: Joi.string()
      .allow(
        "dust2",
        "mirage",
        "nuke",
        "inferno",
        "anubis",
        "overpass",
        "cobblestone"
      )
      .required(),
    movement: Joi.string()
      .allow("stationary", "running", "walking", "crouching", "crouchwalking")
      .required(),
    technique: Joi.string()
      .allow("mouseleft", "mouseright", "mouseboth", "jumpthrow")
      .required(),
    tickrate: Joi.string().allow("tick64", "tick128", "any").optional(),
    type: Joi.string()
      .allow("smoke", "flash", "molotov", "hegrenade")
      .required(),
    mapEndCoord: Joi.object()
      .keys({
        x: Joi.number(),
        y: Joi.number(),
      })
      .required(),
  }).unknown(false);

  const value = Joi.attempt(body, schema) as NadeCreateDTO;

  return value;
};

export const validateNadeEditBody = (req: Request): NadeUpdateDTO => {
  const body = req.body as NadeUpdateDTO;
  const schema = Joi.object<NadeUpdateDTO>({
    // gfycat?: GfycatData;
    gfycat: Joi.object()
      .keys({
        gfyId: Joi.string(),
        smallVideoUrl: Joi.string().uri(),
        largeVideoUrl: Joi.string().uri(),
        largeVideoWebm: Joi.string().uri(),
        avgColor: Joi.string().optional(),
        duration: Joi.string().optional(),
      })
      .optional(),
    // imageBase64?: string;
    imageBase64: Joi.string().optional(),
    // startPosition?: string;
    startPosition: Joi.string().optional(),
    // endPosition?: string;
    endPosition: Joi.string().optional(),
    // description?: string;
    description: Joi.string().optional(),
    // map?: CsgoMap;
    map: Joi.string()
      .allow(
        "dust2",
        "mirage",
        "nuke",
        "inferno",
        "anubis",
        "overpass",
        "cobblestone"
      )
      .optional(),
    // movement?: Movement;
    movement: Joi.string()
      .allow("stationary", "running", "walking", "crouching", "crouchwalking")
      .optional(),
    // technique?: Technique;
    technique: Joi.string()
      .allow("mouseleft", "mouseright", "mouseboth", "jumpthrow")
      .optional(),
    // tickrate?: Tickrate;
    tickrate: Joi.string().allow("tick64", "tick128", "any").optional(),
    // type?: NadeType;
    type: Joi.string()
      .allow("smoke", "flash", "molotov", "hegrenade")
      .optional(),
    // mapEndCoord?: MapCoordinates;
    mapEndCoord: Joi.object()
      .keys({
        x: Joi.number(),
        y: Joi.number(),
      })
      .optional(),
    //status?: NadeStatus;
    status: Joi.string()
      .allow("pending", "accepted", "declined", "deleted")
      .optional(),
    // slug?: string;
    slug: Joi.string().optional(),
  }).unknown(false);

  const value = Joi.attempt(body, schema) as NadeUpdateDTO;

  return value;
};
