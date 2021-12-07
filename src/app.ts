import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import passport from "passport";
import { AuditRouter } from "./audit/AuditRouter";
import { CommentRouter } from "./comment/CommentRouter";
import { CSGNConfig } from "./config/enironment";
import { ContactRouter } from "./contact/ContactRouter";
import { GfycatApi } from "./external-api/GfycatApi";
import { SteamApi } from "./external-api/SteamApi";
import { FavoriteRouter } from "./favorite/FavoriteRouter";
import { Logger } from "./logger/Logger";
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
    windowMs: 10 * 60 * 1000, // 15 minutes
    max: 100,
    onLimitReached: (req) => {
      console.log(
        "> Global request limit reached",
        req.ip,
        req.rateLimit.resetTime,
        req.rateLimit.current
      );
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

  const gfycatApi = new GfycatApi(config);
  const steamApi = new SteamApi(config);

  const persist = persistInit(config);
  const repositories = repoInit(persist);
  const {
    auditService,
    commentService,
    contactService,
    favoriteService,
    nadeService,
    notificationService,
    reporService,
    userService,
  } = serviceInit(config, repositories, gfycatApi, steamApi);

  // Routers
  const statusRouter = new StatusRouter();
  const nadeRouter = new NadeRouter({
    gfycatApi,
    nadeService,
    auditService,
    userService,
    commentService,
  });

  const steamRouter = new SteamRouter(passport, config, userService).router;
  const userRouter = makeUserRouter(userService);
  const favoriteRouter = new FavoriteRouter({ favoriteService });
  const statsRouter = makeStatsRouter(repositories.statsRepo);
  const contactRouter = new ContactRouter(contactService).getRouter();
  const reportRouter = new ReportRouter(reporService).getRouter();
  const notificationRouter = new NotificationRouter(
    notificationService
  ).getRouter();
  const nadeCommentRouter = new CommentRouter({ commentService });
  const auditRouter = new AuditRouter(auditService);

  app.use(nadeRouter.getRouter());
  app.use(steamRouter);
  app.use(userRouter);
  app.use(statusRouter.getRouter());
  app.use(favoriteRouter.getRouter());
  app.use(statsRouter);
  app.use(contactRouter);
  app.use(reportRouter);
  app.use(notificationRouter);
  app.use(nadeCommentRouter.getRouter());
  app.use(auditRouter.getRouter());

  app.get("/", (_req, res) => {
    res.send("");
  });

  app.use("/robots.txt", function (_req, res, _next) {
    res.type("text/plain");
    res.send("User-agent: *\nDisallow: /");
  });

  const sessionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 5,
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
    const error = errorCatchConverter(err);
    return res.status(error.code).send(error.message);
  };

  app.use(customErrorHandler);

  app.use(Sentry.Handlers.errorHandler());

  return app;
};
