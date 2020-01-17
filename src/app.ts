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
import { FavoriteRepo } from "./favorite/FavoriteRepo";
import { makeFavoriteRouter } from "./favorite/FavoriteRouter";
import { FavoriteService } from "./favorite/FavoriteService";
import { NadeRepo } from "./nade/NadeRepo";
import { makeNadeRouter } from "./nade/NadeRouter";
import { NadeService } from "./nade/NadeService";
import { ReportRepo } from "./reports/ReportRepo";
import { ReportRouter } from "./reports/ReportRouter";
import { ReportService } from "./reports/ReportService";
import { CachingService } from "./services/CachingService";
import { makeGfycatService } from "./services/GfycatService";
import { ImageStorageService } from "./services/ImageStorageService";
import { StatsRepo } from "./stats/StatsRepo";
import { makeStatsRouter } from "./stats/StatsRouter";
import { StatsService } from "./stats/StatsService";
import { makeStatusRouter } from "./status/StatusRouter";
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
  const userRepo = new UserRepo(db);
  const nadeRepo = new NadeRepo();
  const favoriteRepo = new FavoriteRepo();
  const statsRepo = new StatsRepo();
  const contactRepo = new ContactRepo();
  const articleRepo = new ArticleRepo();
  const tournamentRepo = new TournamentRepo();
  const reportRepo = new ReportRepo();

  // Services
  const cacheService = new CachingService();
  const gfycatService = makeGfycatService(config);
  const steamService = new SteamService(config);
  const statsService = new StatsService(statsRepo);
  const imageStorageService = new ImageStorageService(config, bucket);
  const userService = new UserService(userRepo, steamService, statsService);
  const nadeService = new NadeService(
    nadeRepo,
    userService,
    imageStorageService,
    gfycatService,
    statsService,
    cacheService
  );
  const favoriteService = new FavoriteService(favoriteRepo, nadeService);
  const tournamentService = new TournamentService(tournamentRepo, cacheService);
  const reporService = new ReportService(reportRepo);

  // Routers
  const statusRouter = makeStatusRouter(config, cacheService);
  const nadeRouter = makeNadeRouter(config, nadeService, gfycatService);
  const steamRouter = makeSteamRouter(userService, passport, config);
  const userRouter = makeUserRouter(userService, nadeService);
  const favoriteRouter = makeFavoriteRouter(favoriteService);
  const statsRouter = makeStatsRouter(statsService);
  const contactRouter = new ContactRouter(contactRepo).getRouter();
  const articleRouter = new ArticleController(articleRepo).getRouter();
  const tournamentRouter = new TournamentController(
    tournamentService
  ).getRouter();
  const reportRouter = new ReportRouter(reporService).getRouter();

  app.use(nadeRouter);
  app.use(steamRouter);
  app.use(userRouter);
  app.use(statusRouter);
  app.use(favoriteRouter);
  app.use(statsRouter);
  app.use(contactRouter);
  app.use(articleRouter);
  app.use(tournamentRouter);
  app.use(reportRouter);

  app.get("/", (_, res) => {
    res.send("");
  });

  // Called by client to set up session
  app.post("/initSession", sessionRoute);

  app.use(Sentry.Handlers.errorHandler());

  return app;
};
