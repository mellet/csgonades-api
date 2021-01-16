import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import passport from "passport";
import { ArticleController } from "./article/ArticleController";
import { ArticleRepo } from "./article/ArticleRepo";
import { ArticleService } from "./article/ArticleService";
import { AuditRepo } from "./audit/AuditRepo";
import { AuditRouter } from "./audit/AuditRouter";
import { AuditService } from "./audit/AuditService";
import { CSGNConfig } from "./config/enironment";
import { ContactRepo } from "./contact/ContactRepo";
import { ContactRouter } from "./contact/ContactRouter";
import { ContactService } from "./contact/ContactService";
import { FavoriteRepo } from "./favorite/FavoriteRepo";
import { FavoriteRouter } from "./favorite/FavoriteRouter";
import { FavoriteService } from "./favorite/FavoriteService";
import { ImageGalleryService } from "./imageGallery/ImageGalleryService";
import { ImageStorageRepo } from "./imageGallery/ImageStorageService";
import { NadeRepo } from "./nade/NadeRepo";
import { NadeRouter } from "./nade/NadeRouter";
import { NadeService } from "./nade/NadeService";
import { NadeCommentRepo } from "./nadecomment/NadeCommentRepo";
import { NadeCommentRouter } from "./nadecomment/NadeCommentRouter";
import { NadeCommentService } from "./nadecomment/NadeCommentService";
import { NotificationRepo } from "./notifications/NotificationRepo";
import { NotificationRouter } from "./notifications/NotificationRouter";
import { NotificationService } from "./notifications/NotificationService";
import { ReportRepo } from "./reports/ReportRepo";
import { ReportRouter } from "./reports/ReportRouter";
import { ReportService } from "./reports/ReportService";
import { CachingService } from "./services/CachingService";
import { EventBus } from "./services/EventHandler";
import { makeGfycatService } from "./services/GfycatService";
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
import { VoteRepo } from "./votes/VoteRepo";
import { VoteRouter } from "./votes/VoteRouter";
import { VoteService } from "./votes/VoteService";

export const AppServer = (config: CSGNConfig) => {
  const app = express();

  // Express dependencies.
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }
        if (
          origin.includes("csgonades.com") ||
          origin.includes("csgonades-next.now.sh") ||
          origin.includes("steamcommunity.com") ||
          origin.includes(":3000")
        ) {
          return callback(null, true);
        }

        const message = `The CORS policy for this origin doesn't allow access from the particular origin. Origin: ${origin}`;
        console.warn("Request from unknown origin", origin);
        return callback(new Error(message), false);
      },
      credentials: true,
    })
  );
  app.use(Sentry.Handlers.requestHandler());
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(passport.initialize());
  app.use(cookieParser(config.secrets.server_key));
  app.use(helmet());
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
  const imageRepo = new ImageStorageRepo(bucket);
  const nadeCommentRepo = new NadeCommentRepo();
  const voteRepo = new VoteRepo();
  const auditRepo = new AuditRepo();

  // Event bus so services can send events that others can subscribe to
  const eventBus = new EventBus();

  // Services
  const auditService = new AuditService({ auditRepo });
  const cacheService = new CachingService();
  const steamService = new SteamService(config);
  const statsService = new StatsService({
    eventBus,
    statsRepo,
    cacheService,
  });
  const galleryService = new ImageGalleryService({
    config,
    imageRepo,
  });
  const gfycatService = makeGfycatService(config);

  const reporService = new ReportService({ eventBus, reportRepo });
  const userService = new UserService({
    eventBus,
    steamService,
    userRepo,
  });
  const nadeService = new NadeService({
    cache: cacheService,
    gfycatService,
    galleryService,
    nadeRepo,
    userService,
    eventBus,
  });
  const favoriteService = new FavoriteService({ favoriteRepo, eventBus });
  const tournamentService = new TournamentService(tournamentRepo, cacheService);

  const notificationService = new NotificationService({
    eventBus,
    notificationRepo,
    nadeService,
    userService,
  });

  const contactService = new ContactService({
    contactRepo,
    notificationService,
  });

  const articleService = new ArticleService({
    articleRepo,
  });

  const nadeCommentService = new NadeCommentService({
    nadeCommentRepo,
    userService,
    eventBus,
  });
  const voteService = new VoteService({ eventBus, voteRepo });

  // Routers
  const statusRouter = new StatusRouter({ cache: cacheService });
  const nadeRouter = new NadeRouter({
    gfycatService,
    nadeService,
    auditService,
    userService,
  });
  const steamRouter = makeSteamRouter(userService, passport, config);
  const userRouter = makeUserRouter(userService);
  const favoriteRouter = new FavoriteRouter({ favoriteService });
  const statsRouter = makeStatsRouter(statsService);
  const contactRouter = new ContactRouter(contactService).getRouter();
  const articleRouter = new ArticleController(articleService).getRouter();
  const tournamentRouter = new TournamentController(
    tournamentService
  ).getRouter();
  const reportRouter = new ReportRouter(reporService).getRouter();
  const notificationRouter = new NotificationRouter(
    notificationService
  ).getRouter();
  const nadeCommentRouter = new NadeCommentRouter({ nadeCommentService });
  const voteRouter = new VoteRouter({ voteService });
  const auditRouter = new AuditRouter(auditService);

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
  app.use(nadeCommentRouter.getRouter());
  app.use(voteRouter.getRouter());
  app.use(auditRouter.getRouter());

  app.get("/", (_, res) => {
    res.send("");
  });

  app.use("/robots.txt", function (req, res, next) {
    res.type("text/plain");
    res.send("User-agent: *\nDisallow: /");
  });

  // Called by client to set up session
  app.post("/initSession", sessionRoute);

  app.use(function customErrorHandler(err, req, res, next) {
    Sentry.captureException(err);
    res.status(500).send("Unknown error");
  });

  app.use(Sentry.Handlers.errorHandler());

  return app;
};
