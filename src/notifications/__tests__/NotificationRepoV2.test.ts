import { MongoTestDatabase } from "../../database/TestDatabase";
import NotificationModel from "../NotificationModel";
import { NotificationRepoV2 } from "../NotificationRepoV2";

describe("Notification repo", () => {
  let notiRepo: NotificationRepoV2;

  beforeAll(async () => {
    notiRepo = new NotificationRepoV2(NotificationModel);
    MongoTestDatabase.connect();
  });

  afterEach(async () => {
    MongoTestDatabase.clearDatabase();
  });

  afterAll(async () => {
    MongoTestDatabase.closeDatabase();
  });

  it("Add a new favorite notification", async () => {
    const result = await notiRepo.createOrUpdateFavoriteNotification(
      "subjectid",
      "nadeid",
      "userid"
    );

    expect(result._type).toEqual("FavoriteNotification");
    expect(result.favoritedBy).toContain("userid");
    expect(result.favoritedBy.length).toEqual(1);
    expect(result.nadeId).toEqual("nadeid");
    expect(result.viewed).toBe(false);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("Updates excisting favorite notification", async () => {
    const result1 = await notiRepo.createOrUpdateFavoriteNotification(
      "subjectid",
      "nadeid",
      "userid1"
    );

    const result2 = await notiRepo.createOrUpdateFavoriteNotification(
      "subjectid",
      "nadeid",
      "userid2"
    );

    expect(result2.favoritedBy).toContain("userid2");
    expect(result2.favoritedBy).toContain("userid1");
    expect(result2.favoritedBy.length).toEqual(2);
    expect(result2.favoriteCount).toEqual(2);
    expect(result1.createdAt).not.toBe(result2.createdAt);
  });

  it("Can query users notifications", async () => {
    const subject = "subjectid1";
    const otherSubject = "subjectid2";
    const subjectNadeIdFirst = "1";
    const subjectNadeIdSeconds = "2";
    const otherSubjectNadeId = "3";
    const favoritingUserId = "favoritingUserId1";
    const otherFavoritingUserId = "favoritingUserId2";

    await notiRepo.createOrUpdateFavoriteNotification(
      subject,
      subjectNadeIdFirst,
      favoritingUserId
    );
    await notiRepo.createOrUpdateFavoriteNotification(
      subject,
      subjectNadeIdSeconds,
      otherFavoritingUserId
    );
    await notiRepo.createOrUpdateFavoriteNotification(
      otherSubject,
      otherSubjectNadeId,
      favoritingUserId
    );

    const result = await notiRepo.getNotificationForUser(subject);

    expect(result.length).toEqual(2);
  });
});
