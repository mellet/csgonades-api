import { instance, mock, resetCalls, verify, when } from "ts-mockito";
import { CommentRepo } from "../comment/repository/CommentRepo";
import { GfycatApi } from "../external-api/GfycatApi";
import { FavoriteRepo } from "../favorite/FavoriteRepo";
import { ImageRepo } from "../imageGallery/ImageGalleryService";
import { NotificationRepo } from "../notifications/NotificationRepo";
import { StatsRepo } from "../stats/StatsRepo";
import { NadeService, NadeServiceDeps } from "./NadeService";
import { createFakeNade } from "./NadeTestHelpers";
import { NadeRepo } from "./repository/NadeRepo";

describe("Nade service", () => {
  let nadeService: NadeService;
  let mockedDeps: NadeServiceDeps;
  let deps: NadeServiceDeps;

  beforeAll(() => {
    mockedDeps = {
      commentRepo: mock<CommentRepo>(),
      favoriteRepo: mock(FavoriteRepo),
      gfycatApi: mock(GfycatApi),
      imageRepo: mock(ImageRepo),
      nadeRepo: mock<NadeRepo>(),
      notificationRepo: mock(NotificationRepo),
      statsRepo: mock(StatsRepo),
    };

    deps = {
      commentRepo: instance(mockedDeps.commentRepo),
      favoriteRepo: instance(mockedDeps.favoriteRepo),
      gfycatApi: instance(mockedDeps.gfycatApi),
      imageRepo: instance(mockedDeps.imageRepo),
      nadeRepo: instance(mockedDeps.nadeRepo),
      notificationRepo: instance(mockedDeps.notificationRepo),
      statsRepo: instance(mockedDeps.statsRepo),
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

    when(mockedDeps.nadeRepo.getAll(0)).thenResolve(fakeResult);

    const nades = await nadeService.getRecent(0);

    expect(nades).toEqual(fakeResult);
    verify(mockedDeps.nadeRepo.getAll(0)).once();
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
    const fakeResult = createFakeNade(fakeNadeId);

    when(mockedDeps.nadeRepo.getById(fakeNadeId)).thenResolve(fakeResult);

    const nades = await nadeService.getById(fakeNadeId);

    expect(nades).toEqual(fakeResult);
    verify(mockedDeps.nadeRepo.getById(fakeNadeId)).once();
  });
  /*
  it("getBySlug");

  it("getByMap");

  it("getByUser");

  it("save");

  it("delete");

  it("update");
  */
});
