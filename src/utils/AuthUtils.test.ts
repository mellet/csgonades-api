import { createRefreshToken, payloadFromToken } from "./AuthUtils";
import { CSGNUser } from "../user/User";

describe("Auth Utils", () => {
  it("Creates a valid refresh token", () => {
    const user: CSGNUser = {
      steamID: "123",
      email: "test@mail.com",
      nickname: "nickname",
      role: "user",
      avatar: null,
      bio: null,
      createdAt: new Date(),
      lastActive: new Date(),
      updatedAt: new Date()
    };

    const token = createRefreshToken("secret", user);
    const payload = payloadFromToken("secret", token);
    expect(payload.steamId).toEqual(user.steamID);
    expect(payload.role).toEqual(user.role);
  });
});
