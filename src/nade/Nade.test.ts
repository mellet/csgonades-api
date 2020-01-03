import {
  updatedNadeMerge,
  NadeUpdateDTO,
  GfycatData,
  NadeStats,
  NadeModel
} from "./Nade";
import { UserModel } from "../user/UserModel";

const dummyNade: NadeModel = {
  title: "Old title",
  description: "Old description",
  map: "dust2",
  movement: "stationary",
  technique: "mouseleft",
  tickrate: "Any",
  type: "smoke",
  updatedAt: new Date(),
  createdAt: new Date(),
  lastGfycatUpdate: new Date(),
  gfycat: {
    gfyId: "old-gfyId",
    smallVideoUrl: "old-smallUrl",
    largeVideoUrl: "old-largeVideo"
  },
  stats: {
    comments: 1,
    favorited: 2,
    views: 3
  },
  images: {
    largeId: "largeId",
    largeUrl: "largeUrl",
    thumbnailId: "thumbId",
    thumbnailUrl: "thumbUrl"
  },
  status: "pending",
  steamId: "old-steamId",
  user: {
    nickname: "old-user-nickname",
    steamId: "old-steamId",
    avatar: ""
  },
  statusInfo: "old-statusInfo",
  mapSite: "a"
};

describe("Nade tests", () => {
  it("Empty case", () => {
    const updatedNade = updatedNadeMerge({});

    // All field should be unchanged
    expect(updatedNade.title).toEqual(dummyNade.title);
    expect(updatedNade.description).toEqual(dummyNade.description);
    expect(updatedNade.map).toEqual(dummyNade.map);
    expect(updatedNade.tickrate).toEqual(dummyNade.tickrate);
    expect(updatedNade.movement).toEqual(dummyNade.movement);
    expect(updatedNade.status).toEqual(dummyNade.status);
    expect(updatedNade.statusInfo).toEqual(dummyNade.statusInfo);
    expect(updatedNade.technique).toEqual(dummyNade.technique);
    expect(updatedNade.type).toEqual(dummyNade.type);
    expect(updatedNade.gfycat).toEqual(dummyNade.gfycat);
    expect(updatedNade.stats).toEqual(dummyNade.stats);
    expect(updatedNade.steamId).toEqual(dummyNade.steamId);
    expect(updatedNade.createdAt).toEqual(dummyNade.createdAt);
    expect(updatedNade.images).toEqual(dummyNade.images);
    expect(updatedNade.mapSite).toEqual(dummyNade.mapSite);
  });

  it("Updates simple fields", () => {
    const updatedField: NadeUpdateDTO = {
      title: "NewTitle",
      description: "NewDescription",
      map: "mirage",
      tickrate: "128 tick",
      technique: "jumpthrow",
      type: "flash",
      movement: "running"
    };

    const updatedNade = updatedNadeMerge(updatedField);

    // Fields that should have changed
    expect(updatedNade.title).toEqual(updatedField.title);
    expect(updatedNade.description).toEqual(updatedField.description);
    expect(updatedNade.map).toEqual(updatedField.map);
    expect(updatedNade.tickrate).toEqual(updatedField.tickrate);
    expect(updatedNade.movement).toEqual(updatedField.movement);
    expect(updatedNade.technique).toEqual(updatedField.technique);
    expect(updatedNade.type).toEqual(updatedField.type);

    // Check unchanged field
    expect(updatedNade.gfycat).toEqual(dummyNade.gfycat);
    expect(updatedNade.stats).toEqual(dummyNade.stats);
    expect(updatedNade.steamId).toEqual(dummyNade.steamId);
    expect(updatedNade.createdAt).toEqual(dummyNade.createdAt);
    expect(updatedNade.images).toEqual(dummyNade.images);
  });

  it("Updates user", () => {
    const newUser: UserModel = {
      steamId: "new-steamId",
      nickname: "new-nickName",
      role: "moderator",
      email: "new-Email",
      avatar: "avatarUrl",
      bio: "newBio",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActive: new Date()
    };

    const updatedNade = updatedNadeMerge({}, newUser);

    expect(updatedNade.user).toEqual(newUser);
    expect(updatedNade.steamId).toEqual(newUser.steamId);
  });

  it("Updates gfycat data", () => {
    const newGfycatData: GfycatData = {
      gfyId: "new-gfyId",
      smallVideoUrl: "new-smallVideoUrl",
      largeVideoUrl: "new-largeVideoUrl"
    };

    const updatedNade = updatedNadeMerge({}, undefined, newGfycatData);

    expect(updatedNade.gfycat).toEqual(newGfycatData);
  });

  it("Updates stats correcly", () => {
    const newStats: NadeStats = {
      comments: 1,
      favorited: 1,
      views: 100
    };

    const updatedNade = updatedNadeMerge({}, undefined, undefined, newStats);

    expect(updatedNade.stats).toEqual(newStats);
  });
});
