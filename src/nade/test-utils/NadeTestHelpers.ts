import { NadeDto } from "../dto/NadeDto";

export const createFakeNade = (
  nadeId: string,
  ownerSteamId?: string
): NadeDto => ({
  id: nadeId,
  commentCount: 0,
  createdAt: new Date(),
  favoriteCount: 0,
  gfycat: {
    gfyId: "fakegfy",
    largeVideoUrl: "fakeurl",
    smallVideoUrl: "fakeurl",
  },
  images: {
    thumbnailId: "fakethumbid",
    thumbnailUrl: "fakethumburl",
  },
  lastGfycatUpdate: new Date(),
  nextUpdateInHours: 1,
  score: 0,
  status: "accepted",
  steamId: ownerSteamId || "fakesteamid",
  updatedAt: new Date(),
  user: {
    avatar: "",
    nickname: "",
    steamId: "",
  },
  viewCount: 0,
  description: "",
  imageLineupThumb: {
    id: "",
    collection: "",
    url: "",
  },
});
