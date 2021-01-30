import { UserModel } from "../user/UserModel";
import {
  createAccessToken,
  createRefreshToken,
  isEntityOwnerOrPrivilegedUser,
  payloadFromToken,
} from "./AuthUtils";
const now = new Date();
const mockedUser: UserModel = {
  steamId: "123",
  nickname: "nickname",
  role: "user",
  avatar: "none",
  createdAt: now,
  lastActive: now,
  updatedAt: now,
};

describe("Auth Utils", () => {
  it("can create accesstoken", () => {
    const accessToken = createAccessToken("secret", mockedUser);
    expect(accessToken).toBeDefined();
  });

  it("Creates a valid refresh token", () => {
    const token = createRefreshToken("secret", mockedUser);
    const payload = payloadFromToken("secret", token);
    expect(payload.steamId).toEqual(mockedUser.steamId);
    expect(payload.role).toEqual(mockedUser.role);
  });

  it("Owner is entity owener", () => {
    const allow = isEntityOwnerOrPrivilegedUser("123", mockedUser);
    expect(allow).toBe(true);
  });

  it("Disallows non user", () => {
    const allow = isEntityOwnerOrPrivilegedUser("123");
    expect(allow).toBe(false);
  });

  it("Allows admin even if not owner", () => {
    const allow = isEntityOwnerOrPrivilegedUser("000", {
      ...mockedUser,
      role: "administrator",
    });
    expect(allow).toBe(true);
  });

  it("Allows moderator even if not owner", () => {
    const allow = isEntityOwnerOrPrivilegedUser("000", {
      ...mockedUser,
      role: "moderator",
    });
    expect(allow).toBe(true);
  });
});
