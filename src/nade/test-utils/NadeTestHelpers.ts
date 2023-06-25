import { NadeDto } from "../dto/NadeDto";

export const createMockedNade = (
  nadeId: string,
  ownerSteamId?: string
): NadeDto => ({
  id: nadeId,
  commentCount: 0,
  createdAt: new Date(),
  gameMode: "csgo",
  favoriteCount: 0,
  gfycat: {
    gfyId: "gfyId",
    largeVideoUrl: "largeVideoUrl",
    smallVideoUrl: "smallVideoUrl",
  },
  images: {
    lineup: {
      large: "",
      medium: "",
      small: "",
    },
    result: {
      large: "",
      medium: "",
      small: "",
    },
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
  teamSide: "terrorist",
  imageMain: {
    collection: "nades",
    id: "nadeid",
    url: "nadeUrl",
  },
  map: "dust2",
  mapEndCoord: { x: 0, y: 0 },
  movement: "stationary",
  startPosition: "startPosition",
  type: "smoke",
  technique: "left",
  eloScore: 1400,
});
