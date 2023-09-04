import { makeConfig } from "../../config/enironment";
import { GfycatApi } from "../../external-api/GfycatApi";
import { RequestUser } from "../../utils/AuthUtils";
import { NadeMiniDto } from "../dto/NadeMiniDto";
import { createMockedNade } from "../test-utils/NadeTestHelpers";
import {
  convertToNadeMiniDto,
  newStatsFromGfycat,
  shouldUpdateNadeStats,
  verifyAdminFields,
  verifyAllowEdit,
} from "./NadeUtils";

jest.mock("gfycat-sdk");

describe("Nade Utils", () => {
  it("Verifies that owner is allowed to edit nade", () => {
    const mockNade = createMockedNade("nadeId", "ownerSteamId");

    const mockOwnerOfNade: RequestUser = {
      role: "user",
      steamId: mockNade.steamId,
    };

    expect(() => verifyAllowEdit(mockNade, mockOwnerOfNade)).not.toThrow();
  });

  it("Does not throws when admin", () => {
    const mockNade = createMockedNade("nadeId", "ownerSteamId");

    const mockOwnerOfNade: RequestUser = {
      role: "administrator",
      steamId: "not-owner-steam-id",
    };

    expect(() => verifyAllowEdit(mockNade, mockOwnerOfNade)).not.toThrow();
  });

  it("Does not throws when moderator", () => {
    const mockNade = createMockedNade("nadeId", "ownerSteamId");

    const mockOwnerOfNade: RequestUser = {
      role: "moderator",
      steamId: "not-owner-steam-id",
    };

    expect(() => verifyAllowEdit(mockNade, mockOwnerOfNade)).not.toThrow();
  });

  it("Throws if not owner", () => {
    const mockNade = createMockedNade("nadeId", "ownerSteamId");

    const mockOwnerOfNade: RequestUser = {
      role: "user",
      steamId: "not-owner-steam-id",
    };

    expect(() => verifyAllowEdit(mockNade, mockOwnerOfNade)).toThrow();
  });

  it("shouldUpdateNadeStats if long time ago", () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const nade = createMockedNade("123", "123");
    nade.lastGfycatUpdate = twoDaysAgo;

    const result = shouldUpdateNadeStats(nade);
    expect(result).toBe(true);
  });

  it("shouldUpdateNadeStats, no update if less than 24 hours ago", () => {
    const twoHoursAgo = new Date();
    twoHoursAgo.setTime(twoHoursAgo.getTime() - 2);

    const nade = createMockedNade("123", "123");
    nade.lastGfycatUpdate = twoHoursAgo;

    const result = shouldUpdateNadeStats(nade);
    expect(result).toBe(false);
  });

  it("verifyAdminFields, disaalow slug if non admin", () => {
    const normalUser: RequestUser = {
      role: "user",
      steamId: "steamId",
    };

    expect(() =>
      verifyAdminFields(normalUser, { slug: "nade-slug" })
    ).toThrow();
  });

  it("verifyAdminFields, disallow status update if user", () => {
    const normalUser: RequestUser = {
      role: "user",
      steamId: "steamId",
    };

    expect(() =>
      verifyAdminFields(normalUser, { status: "accepted" })
    ).toThrow();
  });

  it("coverts to light dto", () => {
    const mockNade = createMockedNade("nadeId", "ownerSteamId");

    const expected: NadeMiniDto = {
      commentCount: mockNade.commentCount,
      createdAt: mockNade.createdAt,
      eloScore: mockNade.eloScore,
      endPosition: mockNade.endPosition,
      favoriteCount: mockNade.favoriteCount,
      gameMode: mockNade.gameMode,
      id: mockNade.id,
      imageLineupThumbUrl: mockNade.imageLineupThumb?.url,
      imageMain: mockNade.imageMain,
      imageMainThumb: mockNade.imageMainThumb || mockNade.imageMain,
      images: mockNade.images,
      isPro: mockNade.isPro,
      movement: mockNade.movement,
      oneWay: mockNade.oneWay,
      score: mockNade.score,
      slug: mockNade.slug,
      startPosition: mockNade.startPosition,
      status: mockNade.status,
      teamSide: mockNade.teamSide,
      technique: mockNade.technique,
      tickrate: mockNade.tickrate,
      type: mockNade.type,
      updatedAt: mockNade.updatedAt,
      user: mockNade.user,
      viewCount: mockNade.viewCount,
      mapEndLocationId: mockNade.mapEndLocationId,
      mapStartLocationId: mockNade.mapEndLocationId,
      youTubeId: mockNade.youTubeId,
    };

    const result = convertToNadeMiniDto(mockNade);

    expect(result).toBeDefined();
    expect(result).toMatchObject(expected);
  });

  it("newStatsFromGfycat, works", async () => {
    const config = makeConfig();
    const gfycatApi = new GfycatApi(config);

    const stats = await newStatsFromGfycat("123", gfycatApi);

    expect(stats).toBeDefined();
  });
});
