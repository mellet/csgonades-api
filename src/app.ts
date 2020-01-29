import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import passport from "passport";
import { ArticleController } from "./article/ArticleController";
import { ArticleRepo } from "./article/ArticleRepo";
import { CSGNConfig } from "./config/enironment";
import { ContactRepo } from "./contact/ContactRepo";
import { ContactRouter } from "./contact/ContactRouter";
import { ContactService } from "./contact/ContactService";
import { FavoriteRepo } from "./favorite/FavoriteRepo";
import { FavoriteRouter } from "./favorite/FavoriteRouter";
import { FavoriteService } from "./favorite/FavoriteService";
import { NadeRepo } from "./nade/NadeRepo";
import { NadeRouter } from "./nade/NadeRouter";
import { NadeService } from "./nade/NadeService";
import { NotificationRepo } from "./notifications/NotificationRepo";
import { NotificationRouter } from "./notifications/NotificationRouter";
import { NotificationService } from "./notifications/NotificationService";
import { ReportRepo } from "./reports/ReportRepo";
import { ReportRouter } from "./reports/ReportRouter";
import { ReportService } from "./reports/ReportService";
import { CachingService } from "./services/CachingService";
import { EventBus } from "./services/EventHandler";
import { makeGfycatService } from "./services/GfycatService";
import { ImageStorageRepo } from "./services/ImageStorageService";
import { StatsRepo } from "./stats/StatsRepo";
import { makeStatsRouter } from "./stats/StatsRouter";
import { StatsService } from "./stats/StatsService";
import { StatusRouter } from "./status/StatusRouter";
import { makeSteamRouter } from "./steam/SteamRouter";
import { SteamService } from "./steam/SteamService";
import { makePersistedStorage } from "./storage/FirebaseFirestore";
import { TournamentController } from "./tournament/TournamentController";
import { TournamentRepo } from "./tournament/TournamentRepo";
import { TournamentService } from "./tournament/TournamentService";
import { UserRepo } from "./user/UserRepo";
import { makeUserRouter } from "./user/UserRouter";
import { UserService } from "./user/UserService";
import { extractTokenMiddleware } from "./utils/AuthUtils";
import { sessionRoute } from "./utils/SessionRoute";

declare global {
  namespace NodeJS {
    interface Global {
      __rootdir__: string;
    }
  }
}

global.__rootdir__ = __dirname || process.cwd();

export const AppServer = (config: CSGNConfig) => {
  const app = express();

  Sentry.init({
    dsn: config.secrets.sentry_dsn,
    integrations: [
      new RewriteFrames({
        root: global.__rootdir__
      })
    ]
  });

  // Express dependencies
  app.use(Sentry.Handlers.requestHandler());
  app.use(express.json({ limit: "3mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(passport.initialize());
  app.use(cookieParser(config.secrets.server_key));
  app.use(helmet());
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://www.csgonades.com",
        "https://www.csgonades.com"
      ],
      credentials: true
    })
  );
  app.disable("x-powered-by");
  app.use(extractTokenMiddleware(config));

  // Storage
  const { bucket, db } = makePersistedStorage(config);

  // Repos
  const notificationRepo = new NotificationRepo();

  const userRepo = new UserRepo(db);
  const nadeRepo = new NadeRepo();
  const favoriteRepo = new FavoriteRepo();
  const statsRepo = new StatsRepo();
  const contactRepo = new ContactRepo();
  const articleRepo = new ArticleRepo();
  const tournamentRepo = new TournamentRepo();
  const reportRepo = new ReportRepo();

  // Event bus so services can send events that others can subscribe to
  const eventBus = new EventBus();

  // Services
  const cacheService = new CachingService();
  const steamService = new SteamService(config);
  const statsService = new StatsService({
    eventBus,
    statsRepo
  });
  const imageStorageService = new ImageStorageRepo(config, bucket);
  const gfycatService = makeGfycatService(config);

  const reporService = new ReportService({ eventBus, reportRepo });
  const userService = new UserService({
    eventBus,
    steamService,
    userRepo
  });
  const nadeService = new NadeService({
    cache: cacheService,
    gfycatService,
    imageStorageService,
    nadeRepo,
    userService,
    eventBus
  });
  const favoriteService = new FavoriteService({ favoriteRepo, eventBus });
  const tournamentService = new TournamentService(tournamentRepo, cacheService);

  const notificationService = new NotificationService({
    eventBus,
    notificationRepo,
    nadeService
  });

  const contactService = new ContactService({
    contactRepo,
    notificationService
  });

  // Routers
  const statusRouter = new StatusRouter({ cache: cacheService });
  const nadeRouter = new NadeRouter({ gfycatService, nadeService });
  const steamRouter = makeSteamRouter(userService, passport, config);
  const userRouter = makeUserRouter(userService, nadeService);
  const favoriteRouter = new FavoriteRouter({ favoriteService });
  const statsRouter = makeStatsRouter(statsService);
  const contactRouter = new ContactRouter(contactService).getRouter();
  const articleRouter = new ArticleController(articleRepo).getRouter();
  const tournamentRouter = new TournamentController(
    tournamentService
  ).getRouter();
  const reportRouter = new ReportRouter(reporService).getRouter();
  const notificationRouter = new NotificationRouter(
    notificationService
  ).getRouter();

  app.use(nadeRouter.getRouter());
  app.use(steamRouter);
  app.use(userRouter);
  app.use(statusRouter.getRouter());
  app.use(favoriteRouter.getRouter());
  app.use(statsRouter);
  app.use(contactRouter);
  app.use(articleRouter);
  app.use(tournamentRouter);
  app.use(reportRouter);
  app.use(notificationRouter);

  app.get("/", (_, res) => {
    res.send("");
  });

  // Called by client to set up session
  app.post("/initSession", sessionRoute);

  app.use(Sentry.Handlers.errorHandler());

  return app;
};
