import { anything, instance, mock, resetCalls, verify, when } from "ts-mockito";
import { NadeRepo } from "../nade/NadeRepo";
import { createFakeNade } from "../nade/NadeTestHelpers";
import { NotificationRepo } from "../notifications/NotificationRepo";
import { UserDto } from "../user/UserDTOs";
import { UserRepo } from "../user/UserRepo";
import { AppContext } from "../utils/AppContext";
import { CommentService, CommentServiceDeps } from "./CommentService";
import { CommentDto } from "./dto/CommentDto";
import { CommentFireRepo } from "./repository/CommentFireRepo";

describe("Comment service", () => {
  let commentService: CommentService;
  let deps: CommentServiceDeps;
  let mockInstances: CommentServiceDeps;

  beforeAll(() => {
    deps = {
      commentRepo: mock(CommentFireRepo),
      nadeRepo: mock(NadeRepo),
      notificationRepo: mock(NotificationRepo),
      userRepo: mock(UserRepo),
    };

    mockInstances = {
      commentRepo: instance(deps.commentRepo),
      nadeRepo: instance(deps.nadeRepo),
      notificationRepo: instance(deps.notificationRepo),
      userRepo: instance(deps.userRepo),
    };
  });

  beforeEach(() => {
    resetCalls(deps.commentRepo);
    resetCalls(deps.nadeRepo);
    resetCalls(deps.notificationRepo);
    commentService = new CommentService(mockInstances);
  });

  it("getForNade", async () => {
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
      createFakeNade("123", testSteamId)
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
      createFakeNade("123", "other-steam-id")
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
});

function createFakeComment(): CommentDto {
  return {
    id: "123",
    nadeId: "",
    createdAt: new Date(),
    message: "",
    nickname: "",
    steamId: "",
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
