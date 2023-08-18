import { anything, instance, mock, resetCalls, verify, when } from "ts-mockito";
import { CommentRepo } from "../comment/repository/CommentRepo";
import { GfycatApi } from "../external-api/GfycatApi";
import { GoogleApi } from "../external-api/GoogleApi";
import { FavoriteRepo } from "../favorite/repository/FavoriteRepo";
import { ImageRepo } from "../imageGallery/ImageGalleryService";
import { NotificationRepo } from "../notifications/repository/NotificationRepo";
import { StatsRepo } from "../stats/repository/StatsRepo";
import { UserRepo } from "../user/repository/UserRepo";
import { NadeService, NadeServiceDeps } from "./NadeService";
import { NadeRepo } from "./repository/NadeRepo";
import { createMockedNade } from "./test-utils/NadeTestHelpers";

describe("Nade service", () => {
  let nadeService: NadeService;
  let mockedDeps: NadeServiceDeps;
  let deps: NadeServiceDeps;

  beforeAll(() => {
    mockedDeps = {
      commentRepo: mock<CommentRepo>(),
      favoriteRepo: mock<FavoriteRepo>(),
      gfycatApi: mock(GfycatApi),
      imageRepo: mock(ImageRepo),
      nadeRepo: mock<NadeRepo>(),
      notificationRepo: mock<NotificationRepo>(),
      statsRepo: mock<StatsRepo>(),
      userRepo: mock<UserRepo>(),
      googleApi: mock<GoogleApi>(),
    };

    deps = {
      commentRepo: instance(mockedDeps.commentRepo),
      favoriteRepo: instance(mockedDeps.favoriteRepo),
      gfycatApi: instance(mockedDeps.gfycatApi),
      imageRepo: instance(mockedDeps.imageRepo),
      nadeRepo: instance(mockedDeps.nadeRepo),
      notificationRepo: instance(mockedDeps.notificationRepo),
      statsRepo: instance(mockedDeps.statsRepo),
      userRepo: instance(mockedDeps.userRepo),
      googleApi: instance(mockedDeps.googleApi),
    };
  });

  beforeEach(() => {
    resetCalls(mockedDeps.commentRepo);
    resetCalls(mockedDeps.favoriteRepo);
    resetCalls(mockedDeps.gfycatApi);
    resetCalls(mockedDeps.imageRepo);
    resetCalls(mockedDeps.nadeRepo);
    resetCalls(mockedDeps.notificationRepo);
    resetCalls(mockedDeps.statsRepo);
    nadeService = new NadeService(deps);
  });

  it("isSlugAvailable", async () => {
    const testSlug = "some-nade-slug";

    await nadeService.isSlugAvailable(testSlug);

    verify(mockedDeps.nadeRepo.isSlugAvailable(testSlug)).once();
  });

  it("getRecent", async () => {
    const fakeResult = [];

    when(mockedDeps.nadeRepo.getRecent()).thenResolve(fakeResult);

    const nades = await nadeService.getRecent();

    expect(nades).toEqual(fakeResult);
    verify(mockedDeps.nadeRepo.getRecent()).once();
  });

  it("getPending", async () => {
    const fakeResult = [];

    when(mockedDeps.nadeRepo.getPending()).thenResolve(fakeResult);

    const nades = await nadeService.getPending();

    expect(nades).toEqual(fakeResult);
    verify(mockedDeps.nadeRepo.getPending()).once();
  });

  it("getDeclined", async () => {
    const fakeResult = [];

    when(mockedDeps.nadeRepo.getDeclined()).thenResolve(fakeResult);

    const nades = await nadeService.getDeclined();

    expect(nades).toEqual(fakeResult);
    verify(mockedDeps.nadeRepo.getDeclined()).once();
  });

  it("getById", async () => {
    const fakeNadeId = "nadeid";
    const fakeResult = createMockedNade(fakeNadeId);

    when(mockedDeps.nadeRepo.getById(fakeNadeId)).thenResolve(fakeResult);

    const nades = await nadeService.getById(fakeNadeId);

    expect(nades).toEqual(fakeResult);
    verify(mockedDeps.nadeRepo.getById(fakeNadeId)).once();
  });

  it("getBySlug", async () => {
    const fakeNadeId = "nade-slug";
    const fakeResult = createMockedNade(fakeNadeId);

    when(mockedDeps.nadeRepo.getBySlug(fakeNadeId)).thenResolve(fakeResult);

    const result = await nadeService.getBySlug(fakeNadeId);
    verify(mockedDeps.nadeRepo.getBySlug(fakeNadeId)).once();
    expect(result).toBeDefined();
    expect(result).toEqual(fakeResult);
  });

  it("getByMap", async () => {
    const askedMap = "dust2";
    const fakeResult = [];

    when(mockedDeps.nadeRepo.getByMap(askedMap, anything())).thenResolve(
      fakeResult
    );

    const nades = await nadeService.getByMap(askedMap);

    verify(mockedDeps.nadeRepo.getByMap(askedMap, anything())).once();
    expect(nades).toEqual([]);
  });

  it("getByUser", async () => {
    const steamId = "123";
    const fakeResult = [];

    when(mockedDeps.nadeRepo.getByUser(steamId, anything())).thenResolve(
      fakeResult
    );

    const nades = await nadeService.getByUser(steamId);

    verify(mockedDeps.nadeRepo.getByUser(steamId, anything())).once();
    expect(nades).toEqual(fakeResult);
  });

  it("delete", async () => {
    const nadeId = "123";
    const fakeResult = createMockedNade(nadeId);

    when(mockedDeps.nadeRepo.getById(nadeId)).thenResolve(fakeResult);

    await nadeService.delete(nadeId, {
      role: "administrator",
      steamId: "none",
    });

    verify(mockedDeps.imageRepo.deleteImageResult(anything())).times(2);
    verify(mockedDeps.commentRepo.deleteForNadeId(nadeId)).once();
    verify(mockedDeps.favoriteRepo.deleteWhereNadeId(nadeId)).once();
    verify(mockedDeps.nadeRepo.delete(nadeId)).once();
  });
});
