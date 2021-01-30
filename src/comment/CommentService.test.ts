import { anything, instance, mock, verify, when } from "ts-mockito";
import { NadeRepo } from "../nade/repository/NadeRepo";
import { createMockedNade } from "../nade/test-utils/NadeTestHelpers";
import { NotificationRepo } from "../notifications/repository/NotificationRepo";
import { UserRepo } from "../user/repository/UserRepo";
import { UserDto } from "../user/UserDTOs";
import { AppContext } from "../utils/AppContext";
import { CommentService, CommentServiceDeps } from "./CommentService";
import { CommentDto } from "./dto/CommentDto";
import { CommentRepo } from "./repository/CommentRepo";

describe("Comment service", () => {
  let commentService: CommentService;
  let deps: CommentServiceDeps;

  beforeEach(() => {
    deps = {
      commentRepo: mock<CommentRepo>(),
      nadeRepo: mock<NadeRepo>(),
      notificationRepo: mock<NotificationRepo>(),
      userRepo: mock<UserRepo>(),
    };

    commentService = new CommentService({
      commentRepo: instance(deps.commentRepo),
      nadeRepo: instance(deps.nadeRepo),
      notificationRepo: instance(deps.notificationRepo),
      userRepo: instance(deps.userRepo),
    });
  });

  it("Gets comments for specific nade", async () => {
    const fakeNadeId = "";

    const fakeResult: CommentDto[] = [
      {
        id: "",
        message: "",
        createdAt: new Date(),
        nadeId: fakeNadeId,
        nickname: "",
        steamId: "",
        updatedAt: new Date(),
      },
    ];

    when(deps.commentRepo.getForNade(fakeNadeId)).thenResolve(fakeResult);

    const comments = await commentService.getForNade(fakeNadeId);

    expect(comments).toEqual(fakeResult);
    verify(deps.commentRepo.getForNade(fakeNadeId)).once();
  });

  describe("Saving comments", () => {
    it("Save comment on own nade", async () => {
      const { userRepo, commentRepo, nadeRepo, notificationRepo } = deps;

      // Setup
      const { testContext, testSteamId, testUser } = createTestContext();

      const commentDto = {
        nadeId: "123",
        message: "message",
      };

      const expectedComment = createFakeComment();

      // Mock dependency responses
      when(userRepo.byId(testSteamId)).thenResolve(testUser);
      when(nadeRepo.getById("123")).thenResolve(
        createMockedNade("123", testSteamId)
      );
      when(commentRepo.save(testUser, commentDto)).thenResolve(expectedComment);

      // Act
      const comment = await commentService.save(testContext, commentDto);

      // Expect
      verify(userRepo.byId(testSteamId)).once();
      verify(nadeRepo.getById("123")).once();
      verify(commentRepo.save(testUser, commentDto)).once();
      verify(
        notificationRepo.newCommentNotification(anything(), anything())
      ).never();
      expect(comment).toEqual(expectedComment);
    });

    it("Sends notification when commenting on others nades", async () => {
      const { userRepo, commentRepo, nadeRepo, notificationRepo } = deps;

      // Setup
      const { testContext, testSteamId, testUser } = createTestContext();

      const commentDto = {
        nadeId: "123",
        message: "message",
      };

      const expectedComment = createFakeComment();

      // Mock dependency responses
      when(userRepo.byId(testSteamId)).thenResolve(testUser);
      when(nadeRepo.getById("123")).thenResolve(
        createMockedNade("123", "other-steam-id")
      );
      when(commentRepo.save(testUser, commentDto)).thenResolve(expectedComment);
      when(notificationRepo.newContactMessage()).thenResolve();

      // Act
      await commentService.save(testContext, commentDto);

      // Expect
      verify(
        notificationRepo.newCommentNotification(anything(), anything())
      ).once();
    });

    it("Fail if not authenticated", async () => {
      const { commentRepo } = deps;

      // Setup
      const commentDto = {
        nadeId: "123",
        message: "message",
      };

      // Act
      try {
        await commentService.save({}, commentDto);
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Expect
      verify(commentRepo.save(anything(), anything())).never();
    });

    it("Fail if not authenticated", async () => {
      const { userRepo, commentRepo, nadeRepo, notificationRepo } = deps;

      // Setup
      const { testContext, testSteamId } = createTestContext();

      const commentDto = {
        nadeId: "123",
        message: "message",
      };

      when(userRepo.byId(testSteamId)).thenResolve(null);
      // Act
      try {
        await commentService.save(testContext, commentDto);
      } catch (error) {
        expect(error.message).toEqual("No user found to create comment");
        expect(error.code).toEqual(400);
      }

      // Expect
      verify(commentRepo.save(anything(), anything())).never();
    });
  });

  describe("Updating", () => {
    it("Increments comment count on save", async () => {
      const { userRepo, commentRepo, nadeRepo, notificationRepo } = deps;

      // Setup
      const { testContext, testSteamId, testUser } = createTestContext();

      const commentDto = {
        nadeId: "123",
        message: "message",
      };

      const expectedComment = createFakeComment();

      // Mock dependency responses
      when(userRepo.byId(testSteamId)).thenResolve(testUser);
      when(nadeRepo.getById("123")).thenResolve(
        createMockedNade("123", "other-steam-id")
      );
      when(commentRepo.save(testUser, commentDto)).thenResolve(expectedComment);
      when(notificationRepo.newContactMessage()).thenResolve();

      // Act
      await commentService.save(testContext, commentDto);

      // Expect
      verify(nadeRepo.incrementCommentCount(anything())).once();
    });

    it("Updates comment properly", async () => {
      const { commentRepo } = deps;

      const { testContext, testSteamId, testUser } = createTestContext();

      const testComment = createFakeComment({ steamId: testSteamId });

      const updateCommentDto = {
        id: "id",
        message: "message",
      };

      when(commentRepo.getById(updateCommentDto.id)).thenResolve(testComment);
      when(commentRepo.update(updateCommentDto)).thenResolve(testComment);

      await commentService.update(testContext, updateCommentDto);

      verify(commentRepo.getById(anything())).once();
      verify(commentRepo.update(anything())).once();
    });

    it("Disallows editing others comments", async () => {
      const { commentRepo } = deps;

      const { testContext } = createTestContext();

      const testComment = createFakeComment({ steamId: "other-user" });

      const updateCommentDto = {
        id: "id",
        message: "message",
      };

      when(commentRepo.getById(updateCommentDto.id)).thenResolve(testComment);
      when(commentRepo.update(updateCommentDto)).thenResolve(testComment);

      try {
        await commentService.update(testContext, updateCommentDto);
      } catch (error) {}

      verify(commentRepo.getById(anything())).once();
      verify(commentRepo.update(anything())).never();
    });

    it("Throws when not authenticates", async () => {
      const { commentRepo } = deps;

      const { testContext } = createTestContext();

      const testComment = createFakeComment({ steamId: "other-user" });

      const updateCommentDto = {
        id: "id",
        message: "message",
      };

      when(commentRepo.getById(updateCommentDto.id)).thenResolve(null);

      try {
        await commentService.update(testContext, updateCommentDto);
      } catch (error) {}

      verify(commentRepo.getById(anything())).once();
      verify(commentRepo.update(anything())).never();
    });
  });

  it("Can delete comment", async () => {
    const { commentRepo } = deps;

    const { testContext, testSteamId } = createTestContext();
    const testComment = createFakeComment({ steamId: testSteamId });

    when(commentRepo.getById(testComment.id)).thenResolve(testComment);
    when(commentRepo.delete(testComment.id)).thenResolve();

    await commentService.delete(testContext, testComment.id);

    verify(commentRepo.delete(testComment.id)).once();
  });

  it("Can disallows deleting others comments", async () => {
    const { commentRepo } = deps;

    const { testContext, testSteamId } = createTestContext();
    const testComment = createFakeComment({ steamId: "other-users-id" });

    when(commentRepo.getById(testComment.id)).thenResolve(testComment);
    when(commentRepo.delete(testComment.id)).thenResolve();

    try {
      await commentService.delete(testContext, testComment.id);
    } catch (error) {}

    verify(commentRepo.delete(testComment.id)).never();
  });

  it("Can fails if comment not found", async () => {
    const { commentRepo } = deps;

    const { testContext, testSteamId } = createTestContext();
    const testComment = createFakeComment({ steamId: "other-users-id" });

    when(commentRepo.getById(testComment.id)).thenResolve(null);
    when(commentRepo.delete(testComment.id)).thenResolve();

    try {
      await commentService.delete(testContext, testComment.id);
    } catch (error) {
      expect(error).toBeDefined();
    }

    verify(commentRepo.delete(testComment.id)).never();
  });

  it("Deletes comments for nades", async () => {
    const { commentRepo } = deps;

    const nadeId = "123";

    when(commentRepo.getById(nadeId)).thenResolve();

    await commentService.deleteForNadeId(nadeId);

    verify(commentRepo.deleteForNadeId(nadeId)).once();
  });
});

type TestCommentOverrides = {
  steamId?: string;
};

function createFakeComment(overrides?: TestCommentOverrides): CommentDto {
  return {
    id: "123",
    nadeId: "",
    createdAt: new Date(),
    message: "",
    nickname: "",
    steamId: overrides?.steamId || "",
    updatedAt: new Date(),
    avatar: "",
  };
}

function createTestContext() {
  const testSteamId = "123";

  const testContext: AppContext = {
    authUser: {
      steamId: testSteamId,
      role: "user",
    },
  };

  const testUser: UserDto = {
    steamId: testSteamId,
    avatar: "",
    createdAt: new Date(),
    lastActive: new Date(),
    nickname: "",
    role: "user",
    updatedAt: new Date(),
  };

  return {
    testSteamId,
    testContext,
    testUser,
  };
}
