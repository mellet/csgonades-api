import moment from "moment";
import { GfycatApi } from "../../external-api/GfycatApi";
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

export function shouldUpdateNadeStats(nade: NadeDto) {
  const hoursSinceUpdate = moment().diff(
    moment(nade.lastGfycatUpdate),
    "hours",
    false
  );

  const shouldUpdate = hoursSinceUpdate >= 24;

  return shouldUpdate;
}

export function convertToNadeMiniDto(nadeDto: NadeDto): NadeMiniDto {
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
  return nades.map(convertToNadeMiniDto);
}

// TODO: Probably belongs to GfycatApi
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
