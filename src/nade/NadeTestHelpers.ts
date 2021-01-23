import { NadeDTO } from "./Nade";

export const createFakeNade = (nadeId: string): NadeDTO => ({
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
  steamId: "fakesteamid",
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