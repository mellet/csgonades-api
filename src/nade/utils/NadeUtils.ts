import moment from "moment";
import { RequestUser } from "../../utils/AuthUtils";
import { ErrorFactory } from "../../utils/ErrorUtil";
import { NadeDto } from "../dto/NadeDto";
import { NadeMiniDto } from "../dto/NadeMiniDto";
import { NadeUpdateDto } from "../dto/NadeUpdateDto";

export function verifyAllowEdit(nade: NadeDto, user: RequestUser) {
  const isPrivilegedUser =
    user.role === "administrator" || user.role === "moderator";
  const isNadeOwner = user.steamId === nade.steamId;

  if (!isNadeOwner && !isPrivilegedUser) {
    throw ErrorFactory.Forbidden("You are not allowed to edit this nade");
  }
}

export function verifyAdminFields(
  user: RequestUser,
  nadeUpdateDto: NadeUpdateDto
) {
  if (nadeUpdateDto.slug && user.role !== "administrator") {
    throw ErrorFactory.Forbidden("Only admins can edit nade slug.");
  }

  if (nadeUpdateDto.status && user.role === "user") {
    throw ErrorFactory.Forbidden(
      "You are not allowed to change the nade status."
    );
  }
}

export function shouldUpdateYouTubeViewCount(nade: NadeDto) {
  const hoursBetweenUpdate = 8;
  const hoursSinceLastUpdate = moment().diff(
    moment(nade.lastGfycatUpdate),
    "hours",
    false
  );

  return hoursSinceLastUpdate > hoursBetweenUpdate;
}

export function shouldUpdateNadeStats(nade: NadeDto) {
  const daysSinceCreated = moment().diff(moment(nade.createdAt), "days", false);
  const updateFrequency = daysSinceCreated <= 7 ? 12 : 48;

  const hoursSinceUpdate = moment().diff(
    moment(nade.lastGfycatUpdate),
    "hours",
    false
  );

  const shouldUpdate = hoursSinceUpdate >= updateFrequency;

  return shouldUpdate;
}

export function convertToNadeMiniDto(nadeDto: NadeDto): NadeMiniDto {
  return {
    commentCount: nadeDto.commentCount,
    createdAt: nadeDto.createdAt,
    endPosition: nadeDto.endPosition,
    favoriteCount: nadeDto.favoriteCount || 0,
    gameMode: nadeDto.gameMode,
    id: nadeDto.id,
    imageLineup: nadeDto.imageLineup,
    imageLineupThumb: nadeDto.imageLineupThumb,
    imageLineupThumbUrl: nadeDto.imageLineupThumb?.url,
    imageMain: nadeDto.imageMain,
    imageMainThumb: nadeDto.imageMainThumb || nadeDto.imageMain,
    images: nadeDto.images,
    isNew: isNewNade(nadeDto.createdAt),
    isPro: nadeDto.isPro,
    movement: nadeDto.movement,
    oneWay: nadeDto.oneWay,
    proUrl: nadeDto.proUrl,
    score: nadeDto.score,
    setPos: nadeDto.setPos,
    slug: nadeDto.slug,
    startPosition: nadeDto.startPosition,
    status: nadeDto.status,
    teamSide: nadeDto.teamSide,
    technique: nadeDto.technique,
    tickrate: nadeDto.tickrate,
    type: nadeDto.type,
    updatedAt: nadeDto.updatedAt,
    user: nadeDto.user,
    viewCount: nadeDto.viewCount,
    youTubeId: nadeDto.youTubeId,
    eloScore: nadeDto.eloScore,
    mapEndLocationId: nadeDto.mapEndLocationId,
    mapStartLocationId: nadeDto.mapStartLocationId,
  };
}

export function isNewNade(createdAt: Date | string): boolean {
  const daysSinceAdded = moment().diff(moment(createdAt), "days", false);

  return daysSinceAdded < 7;
}

export function convertNadesToLightDto(nades: NadeDto[]): NadeMiniDto[] {
  return nades.map(convertToNadeMiniDto);
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map(function (word) {
      if (word === "ct") {
        return "CT";
      } else if (word === "t") {
        return "T";
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
