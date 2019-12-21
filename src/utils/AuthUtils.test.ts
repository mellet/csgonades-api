import { createRefreshToken, payloadFromToken } from "./AuthUtils";
import { UserModel } from "../user/UserModel";
import { firestore } from "firebase-admin";

describe("Auth Utils", () => {
  it("Creates a valid refresh token", () => {
    const now = firestore.Timestamp.fromDate(new Date());
    const user: UserModel = {
      steamId: "123",
      nickname: "nickname",
      role: "user",
      avatar: "none",
      createdAt: now,
      lastActive: now,
      updatedAt: now
    };

    const token = createRefreshToken("secret", user);
    const payload = payloadFromToken("secret", token);
    expect(payload.steamId).toEqual(user.steamId);
    expect(payload.role).toEqual(user.role);
  });
});
