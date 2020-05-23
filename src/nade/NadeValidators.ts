import Joi from "@hapi/joi";
import { Request } from "express";
import { NadeCreateDTO, NadeUpdateDTO } from "./Nade";

export const validateNadeCreateBody = (req: Request): NadeCreateDTO => {
  const body = req.body as NadeCreateDTO;
  const schema = Joi.object<NadeCreateDTO>({
    // gfycat: GfycatData;
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
    // imageBase64: string;
    imageBase64: Joi.string().required(),
    // lineUpImageBase64?: string;
    lineUpImageBase64: Joi.string().optional(),
    // startPosition: string;
    startPosition: Joi.string().required(),
    // endPosition: string;
    endPosition: Joi.string().required(),
    // description: string;
    description: Joi.string().required(),
    // map: CsgoMap;
    map: Joi.string()
      .allow(
        "dust2",
        "mirage",
        "nuke",
        "inferno",
        "cache",
        "vertigo",
        "anubis",
        "train",
        "overpass",
        "cobblestone"
      )
      .required(),
    // movement: Movement;
    movement: Joi.string()
      .allow("stationary", "running", "walking", "crouching", "crouchwalking")
      .required(),
    // technique: Technique;
    technique: Joi.string()
      .allow("left", "right", "both", "jumpthrow")
      .required(),
    // tickrate?: Tickrate;
    tickrate: Joi.string().allow("tick64", "tick128", "any").optional(),
    // type: NadeType;
    type: Joi.string()
      .allow("smoke", "flash", "molotov", "hegrenade")
      .required(),
    // mapEndCoord: MapCoordinates;
    mapEndCoord: Joi.object()
      .keys({
        x: Joi.number(),
        y: Joi.number(),
      })
      .required(),
    // oneWay?: boolean;
    oneWay: Joi.boolean().optional(),
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
    lineUpImageBase64: Joi.string().optional(),
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
        "cache",
        "vertigo",
        "anubis",
        "train",
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
      .allow("left", "right", "both", "jumpthrow")
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
    oneWay: Joi.boolean().optional(),
    isPro: Joi.boolean().optional(),
  }).unknown(false);

  const value = Joi.attempt(body, schema) as NadeUpdateDTO;

  return value;
};
