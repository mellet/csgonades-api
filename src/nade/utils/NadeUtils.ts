import moment from "moment";
import { GfycatApi } from "../../external-api/GfycatApi";
import { RequestUser } from "../../utils/AuthUtils";
import { clamp } from "../../utils/Common";
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

export function shouldUpdateNadeStats(nade: NadeDto) {
  if (!nade.lastGfycatUpdate) {
    return true;
  }

  const daysAgoSubmitted = moment().diff(moment(nade.createdAt), "days", false);

  const MIN_HOURS_TO_UPDATE = 6;
  const MAX_HOURS_TO_UPDATE = 72;

  const hoursToWaitForUpdate = clamp(
    daysAgoSubmitted,
    MIN_HOURS_TO_UPDATE,
    MAX_HOURS_TO_UPDATE
  );

  const lastUpdated = nade.lastGfycatUpdate;
  const hoursSinceUpdate = moment().diff(moment(lastUpdated), "hours", false);

  const shouldUpdate = hoursSinceUpdate >= hoursToWaitForUpdate;

  return shouldUpdate;
}

export function hoursToNextStatsUpdate(nade: NadeDto): number {
  if (!nade.lastGfycatUpdate) {
    return 24;
  }

  const daysAgoSubmitted = moment().diff(moment(nade.createdAt), "days", false);

  const MIN_HOURS_TO_UPDATE = 6;
  const MAX_HOURS_TO_UPDATE = 72;

  const hoursToWaitForUpdate = clamp(
    daysAgoSubmitted,
    MIN_HOURS_TO_UPDATE,
    MAX_HOURS_TO_UPDATE
  );

  const lastUpdated = nade.lastGfycatUpdate;
  const hoursSinceUpdate = moment().diff(moment(lastUpdated), "hours", false);

  const nextUpdate = hoursToWaitForUpdate - hoursSinceUpdate;

  if (nextUpdate < 0) {
    return 0;
  }

  return nextUpdate;
}

export function convertToLightNadeDto(nadeDto: NadeDto): NadeMiniDto {
  return {
    id: nadeDto.id,
    commentCount: nadeDto.commentCount,
    createdAt: nadeDto.createdAt,
    downVoteCount: nadeDto.downVoteCount,
    endPosition: nadeDto.endPosition,
    favoriteCount: nadeDto.favoriteCount,
    gfycat: nadeDto.gfycat,
    imageLineupThumbUrl: nadeDto.imageLineupThumb?.url,
    images: nadeDto.images,
    isPro: nadeDto.isPro,
    mapEndCoord: nadeDto.mapEndCoord,
    movement: nadeDto.movement,
    nextUpdateInHours: hoursToNextStatsUpdate(nadeDto),
    oneWay: nadeDto.oneWay,
    score: nadeDto.score,
    slug: nadeDto.slug,
    startPosition: nadeDto.startPosition,
    status: nadeDto.status,
    technique: nadeDto.technique,
    tickrate: nadeDto.tickrate,
    title: nadeDto.title,
    type: nadeDto.type,
    updatedAt: nadeDto.updatedAt,
    upVoteCount: nadeDto.upVoteCount,
    user: nadeDto.user,
    viewCount: nadeDto.viewCount,
  };
}

export function convertNadesToLightDto(nades: NadeDto[]): NadeMiniDto[] {
  return nades.map(convertToLightNadeDto);
}

export async function newStatsFromGfycat(gfyId: string, gfycatApi: GfycatApi) {
  const gfycat = await gfycatApi.getGfycatData(gfyId);

  // Gfycat API down
  if (!gfycat) {
    return;
  }

  return {
    viewCount: gfycat.gfyItem.views,
    gfycat: {
      gfyId: gfycat.gfyItem.gfyId,
      smallVideoUrl: gfycat.gfyItem.mobileUrl,
      largeVideoUrl: gfycat.gfyItem.mp4Url,
      largeVideoWebm: gfycat.gfyItem.webmUrl,
      avgColor: gfycat.gfyItem.avgColor,
      duration: videoDuration(
        gfycat.gfyItem.frameRate,
        gfycat.gfyItem.numFrames
      ),
    },
    lastGfycatUpdate: new Date(),
  };
}

function videoDuration(framerate?: number, numFrames?: number) {
  if (!framerate || !numFrames) {
    return undefined;
  }
  const seconds = Math.floor(numFrames / framerate);
  return `PT0M${seconds}S`;
}
