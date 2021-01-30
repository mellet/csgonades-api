import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import passport from "passport";
import { AuditRouter } from "./audit/AuditRouter";
import { CommentRouter } from "./comment/CommentRouter";
import { CSGNConfig } from "./config/enironment";
import { ContactRouter } from "./contact/ContactRouter";
import { GfycatApi } from "./external-api/GfycatApi";
import { SteamApi } from "./external-api/SteamApi";
import { FavoriteRouter } from "./favorite/FavoriteRouter";
import { NadeRouter } from "./nade/NadeRouter";
import { NotificationRouter } from "./notifications/NotificationRouter";
import { persistInit } from "./persistInit";
import { repoInit } from "./repoInit";
import { ReportRouter } from "./reports/ReportRouter";
import { serviceInit } from "./serviceInit";
import { makeStatsRouter } from "./stats/StatsRouter";
import { StatusRouter } from "./status/StatusRouter";
import { makeSteamRouter } from "./steam/SteamRouter";
import { makeUserRouter } from "./user/UserRouter";
import { extractTokenMiddleware } from "./utils/AuthHandlers";
import { sessionRoute } from "./utils/SessionRoute";

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
          origin.includes(":3000") ||
          origin.includes("csgonades-next.vercel.app")
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

  const steamRouter = makeSteamRouter(userService, passport, config);
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
