import { UserModel } from "../user/UserModel";
import { GfycatData, NadeUpdateDTO, updatedNadeMerge } from "./Nade";

describe("Nade tests", () => {
  it("Empty case", () => {
    const input = {};
    const updatedNade = updatedNadeMerge(input);

    // All field should be unchanged
    expect(updatedNade).toEqual(input);
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

    expect(updatedNade).toEqual(updatedField);
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

    const updatedNade = updatedNadeMerge({}, undefined, newUser);

    expect(updatedNade.user).toEqual(newUser);
    expect(updatedNade.steamId).toEqual(newUser.steamId);
  });

  it("Updates gfycat data", () => {
    const newGfycatData: GfycatData = {
      gfyId: "new-gfyId",
      smallVideoUrl: "new-smallVideoUrl",
      largeVideoUrl: "new-largeVideoUrl"
    };

    const updatedNade = updatedNadeMerge(
      {},
      undefined,
      undefined,
      newGfycatData
    );

    expect(updatedNade.gfycat).toEqual(newGfycatData);
  });

  it("Updates stats correcly", () => {
    const newViewCount = 10;

    const updatedNade = updatedNadeMerge(
      {},
      newViewCount,
      undefined,
      undefined
    );

    expect(updatedNade.viewCount).toEqual(newViewCount);
  });
});
