import Joi from "@hapi/joi";
import { Request } from "express-serve-static-core";
import { NadeCreateDto, NadeEloGame } from "../dto/NadeCreateDto";
import { NadeUpdateDto } from "../dto/NadeUpdateDto";
import { nadeValidMaps } from "../nadeSubTypes/CsgoMap";
import { nadeValidGameModes } from "../nadeSubTypes/GameMode";
import { nadeValidMovements } from "../nadeSubTypes/Movements";
import { nadeValidStatus } from "../nadeSubTypes/NadeStatus";
import { nadeValidTypes } from "../nadeSubTypes/NadeType";
import { nadeValidTeamSide } from "../nadeSubTypes/TeamSide";
import { nadeValidTechniques } from "../nadeSubTypes/Technique";
import { nadeValidTickrate } from "../nadeSubTypes/Tickrate";

export const validateEloGameBody = (req: Request): NadeEloGame => {
  const body = req.body as NadeEloGame;
  const schema = Joi.object<NadeEloGame>({
    nadeOneId: Joi.string(),
    nadeTwoId: Joi.string(),
    winnerId: Joi.string(),
  });

  const value = Joi.attempt(body, schema) as NadeEloGame;

  return value;
};

export const validateNadeCreateBody = (req: Request): NadeCreateDto => {
  const body = req.body as NadeCreateDto;
  const schema = Joi.object<NadeCreateDto>({
    youTubeId: Joi.string().required(),
    imageBase64: Joi.string().required(),
    lineUpImageBase64: Joi.string().required(),
    mapStartLocationId: Joi.string().required(),
    mapEndLocationId: Joi.string().required(),
    gameMode: Joi.string()
      .valid(...nadeValidGameModes())
      .required(),
    description: Joi.string().required(),
    map: Joi.string()
      .valid(...nadeValidMaps())
      .required(),
    movement: Joi.string()
      .valid(...nadeValidMovements())
      .required(),
    technique: Joi.string()
      .valid(...nadeValidTechniques())
      .required(),
    tickrate: Joi.string()
      .valid(...nadeValidTickrate())
      .optional(),
    type: Joi.string()
      .valid(...nadeValidTypes())
      .required(),
    oneWay: Joi.boolean().optional(),
    teamSide: Joi.string()
      .valid(...nadeValidTeamSide())
      .required(),
    setPos: Joi.string().optional(),
    proUrl: Joi.string().optional().allow(""),
  }).unknown(false);

  const value = Joi.attempt(body, schema) as NadeCreateDto;

  return value;
};

export const validateNadeEditBody = (req: Request): NadeUpdateDto => {
  const body = req.body as NadeUpdateDto;
  const schema = Joi.object<NadeUpdateDto>({
    gfycat: Joi.object()
      .keys({
        gfyId: Joi.string(),
        smallVideoUrl: Joi.string().uri(),
        largeVideoUrl: Joi.string().uri(),
        largeVideoWebm: Joi.string().uri(),
        avgColor: Joi.string().optional(),
        duration: Joi.string().optional(),
        size: Joi.number().optional(),
      })
      .optional(),
    youTubeId: Joi.string().optional(),
    imageBase64: Joi.string().optional(),
    lineUpImageBase64: Joi.string().optional(),
    startPosition: Joi.string().optional(),
    endPosition: Joi.string().optional(),
    description: Joi.string().optional(),
    gameMode: Joi.string()
      .valid(...nadeValidGameModes())
      .optional(),
    map: Joi.string()
      .valid(...nadeValidMaps())
      .optional(),
    movement: Joi.string()
      .valid(...nadeValidMovements())
      .optional(),
    technique: Joi.string()
      .valid(...nadeValidTechniques())
      .optional(),
    tickrate: Joi.string()
      .valid(...nadeValidTickrate())
      .optional(),
    type: Joi.string()
      .valid(...nadeValidTypes())
      .optional(),
    mapEndCoord: Joi.object()
      .keys({
        x: Joi.number(),
        y: Joi.number(),
      })
      .optional(),
    mapStartCoord: Joi.object()
      .keys({ x: Joi.number(), y: Joi.number() })
      .optional(),
    mapStartLocationId: Joi.string().optional(),
    mapEndLocationId: Joi.string().optional(),
    status: Joi.string()
      .valid(...nadeValidStatus())
      .optional(),
    slug: Joi.string().optional(),
    oneWay: Joi.boolean().optional(),
    isPro: Joi.boolean().optional(),
    teamSide: Joi.string()
      .valid(...nadeValidTeamSide())
      .optional(),
    setPos: Joi.string().optional(),
    proUrl: Joi.string().optional().allow(""),
  }).unknown(false);

  const value = Joi.attempt(body, schema) as NadeUpdateDto;

  return value;
};
