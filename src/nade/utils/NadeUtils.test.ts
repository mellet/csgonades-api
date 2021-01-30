import { makeConfig } from "../../config/enironment";
import { GfycatApi } from "../../external-api/GfycatApi";
import { RequestUser } from "../../utils/AuthUtils";
import { NadeMiniDto } from "../dto/NadeMiniDto";
import { createMockedNade } from "../test-utils/NadeTestHelpers";
import {
  convertToLightNadeDto,
  hoursToNextStatsUpdate,
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

  it("shouldUpdateNadeStats if never updates", () => {
    const nade = createMockedNade("123", "123");
    //@ts-ignore
    nade.lastGfycatUpdate = undefined;
    const result = shouldUpdateNadeStats(nade);
    expect(result).toBe(true);
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

  it("hoursToNextStatsUpdate, if never updated return default", () => {
    const nade = createMockedNade("123", "123");
    //@ts-ignore
    nade.lastGfycatUpdate = undefined;

    const result = hoursToNextStatsUpdate(nade);

    expect(result).toEqual(24);
  });

  it("hoursToNextStatsUpdate, sets correct hours", () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const nade = createMockedNade("123", "123");
    nade.lastGfycatUpdate = oneDayAgo;
    nade.createdAt = new Date();

    const result = hoursToNextStatsUpdate(nade);

    expect(result).toEqual(0);
  });

  it("hoursToNextStatsUpdate, sets correct hours 2", () => {
    // Created 3 days ago
    const fakeCreatedAt = new Date();
    fakeCreatedAt.setDate(fakeCreatedAt.getDate() - 3);

    // Last updated 1 day ago
    const oneDayAgo = new Date();
    const nade = createMockedNade("123", "123");
    nade.lastGfycatUpdate = oneDayAgo;
    nade.createdAt = fakeCreatedAt;

    const result = hoursToNextStatsUpdate(nade);

    expect(result).toEqual(6);
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
      nextUpdateInHours: 6,
      score: mockNade.score,
      status: mockNade.status,
      updatedAt: mockNade.updatedAt,
      user: mockNade.user,
      viewCount: mockNade.viewCount,
      downVoteCount: mockNade.downVoteCount,
      endPosition: mockNade.endPosition,
      imageLineupThumbUrl: mockNade.imageLineupThumb?.url,
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
    };

    const result = convertToLightNadeDto(mockNade);

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
