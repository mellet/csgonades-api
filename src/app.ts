import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import passport from "passport";
import { AuditRouter } from "./audit/AuditRouter";
import { initCache } from "./cache/initCache";
import { CommentRouter } from "./comment/CommentRouter";
import { CSGNConfig } from "./config/enironment";
import { ContactRouter } from "./contact/ContactRouter";
import { GoogleApi } from "./external-api/GoogleApi";
import { SteamApi } from "./external-api/SteamApi";
import { FavoriteRouter } from "./favorite/FavoriteRouter";
import { Logger } from "./logger/Logger";
import { MapLocationRouter } from "./maplocation/MapLocationRouter";
import { NadeRouter } from "./nade/NadeRouter";
import { NotificationRouter } from "./notifications/NotificationRouter";
import { persistInit } from "./persistInit";
import { repoInit } from "./repoInit";
import { ReportRouter } from "./reports/ReportRouter";
import { serviceInit } from "./serviceInit";
import { makeStatsRouter } from "./stats/StatsRouter";
import { StatusRouter } from "./status/StatusRouter";
import { SteamRouter } from "./steam/SteamRouter";
import { makeUserRouter } from "./user/UserRouter";
import { extractTokenMiddleware } from "./utils/AuthHandlers";
import { errorCatchConverter } from "./utils/ErrorUtil";
import { sessionRoute } from "./utils/SessionRoute";

export const AppServer = (config: CSGNConfig) => {
  const app = express();

  app.set("trust proxy", 1);

  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 5 minutes
    max: 100,
    onLimitReached: (_req) => {
      console.log("> Global request limit reached");
    },
  });
  app.use(limiter);

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
          origin.includes(":3000") ||
          origin.includes("csgonades-next.vercel.app")
        ) {
          return callback(null, true);
        }

        const message = `The CORS policy for this origin doesn't allow access from the particular origin. Origin: ${origin}`;
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

  const googleApi = new GoogleApi(config);
  const steamApi = new SteamApi(config);

  const caches = initCache();

  const persist = persistInit(config);
  const repositories = repoInit(persist, caches);
  const {
    auditService,
    commentService,
    contactService,
    favoriteService,
    nadeService,
    notificationService,
    reporService,
    userService,
  } = serviceInit(config, repositories, steamApi, googleApi);

  // Routers
  const statusRouter = new StatusRouter(caches);
  const nadeRouter = new NadeRouter({
    nadeService,
    auditService,
    userService,
    commentService,
  });

  const steamRouter = new SteamRouter(passport, config, userService);
  const userRouter = makeUserRouter(userService);
  const favoriteRouter = new FavoriteRouter({ favoriteService });
  const statsRouter = makeStatsRouter(repositories.statsRepo);
  const contactRouter = new ContactRouter(contactService);
  const reportRouter = new ReportRouter(reporService);
  const notificationRouter = new NotificationRouter(notificationService);
  const nadeCommentRouter = new CommentRouter({ commentService });
  const auditRouter = new AuditRouter(auditService);
  const mapLocationRouter = new MapLocationRouter({
    mapStartLocationRepo: repositories.mapStartLocationRepo,
    mapEndLocationRepo: repositories.mapEndLocationRepo,
  });

  app.use(nadeRouter.getRouter());
  app.use(steamRouter.router);
  app.use(userRouter);
  app.use(statusRouter.getRouter());
  app.use(favoriteRouter.getRouter());
  app.use(statsRouter);
  app.use(contactRouter.getRouter());
  app.use(reportRouter.getRouter());
  app.use(notificationRouter.getRouter());
  app.use(nadeCommentRouter.getRouter());
  app.use(auditRouter.getRouter());
  app.use(mapLocationRouter.getRouter());

  app.get("/", (_req, res) => {
    res.send("");
  });

  app.use("/robots.txt", function (_req, res, _next) {
    res.type("text/plain");
    res.send("User-agent: *\nDisallow: /");
  });

  const sessionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 50,
    onLimitReached: () => {
      Logger.warning("SessionHandler.initSession | limit reached");
    },
  });

  // Called by client to set up session
  app.post("/initSession", sessionLimiter, sessionRoute);

  const customErrorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    Sentry.captureException(err);
    Logger.error(err);
    const error = errorCatchConverter(err);
    return res.status(error.code).send(error.message);
  };

  app.use(customErrorHandler);

  app.use(Sentry.Handlers.errorHandler());

  return app;
};
