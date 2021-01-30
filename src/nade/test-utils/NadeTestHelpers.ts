import { NadeDto } from "../dto/NadeDto";

export const createMockedNade = (
  nadeId: string,
  ownerSteamId?: string
): NadeDto => ({
  id: nadeId,
  commentCount: 0,
  createdAt: new Date(),
  favoriteCount: 0,
  gfycat: {
    gfyId: "gfyId",
    largeVideoUrl: "largeVideoUrl",
    smallVideoUrl: "smallVideoUrl",
  },
  images: {
    thumbnailId: "thumbnailId",
    thumbnailUrl: "thumbnailUrl",
  },
  lastGfycatUpdate: new Date(),
  score: 0,
  status: "accepted",
  steamId: ownerSteamId || "fakesteamid",
  updatedAt: new Date(),
  user: {
    avatar: "avatar",
    nickname: "nickname",
    steamId: "steamId",
  },
  viewCount: 0,
  description: "",
  imageLineupThumb: {
    id: "id",
    collection: "collection",
    url: "url",
  },
});
