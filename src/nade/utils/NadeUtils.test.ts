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
      id: mockNade.id,
      commentCount: mockNade.commentCount,
      createdAt: mockNade.createdAt,
      favoriteCount: mockNade.favoriteCount,
      gfycat: mockNade.gfycat,
      images: mockNade.images,
      score: mockNade.score,
      status: mockNade.status,
      updatedAt: mockNade.updatedAt,
      user: mockNade.user,
      viewCount: mockNade.viewCount,
      downVoteCount: mockNade.downVoteCount,
      endPosition: mockNade.endPosition,
      imageLineupThumbUrl: mockNade.imageLineupThumb?.url,
      imageMain: mockNade.imageMain,
      isPro: mockNade.isPro,
      mapEndCoord: mockNade.mapEndCoord,
      movement: mockNade.movement,
      oneWay: mockNade.oneWay,
      slug: mockNade.slug,
      startPosition: mockNade.startPosition,
      technique: mockNade.technique,
      tickrate: mockNade.tickrate,
      title: mockNade.title,
      type: mockNade.type,
      upVoteCount: mockNade.upVoteCount,
      teamSide: mockNade.teamSide,
      eloScore: mockNade.eloScore,
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
