import express from "express";
import helmet from "helmet";
import passport from "passport";
import { makeConfig, CSGNConfig } from "./config/enironment";
import cookieParser from "cookie-parser";
import { makeNadeRouter } from "./nade/NadeRouter";
import { makeUserRepo } from "./user/UserRepoFirebase";
import { makeSteamRouter } from "./steam/SteamRouter";
import cors from "cors";
import { makeSteamService } from "./steam/SteamService";
import { makeNadeService } from "./nade/NadeService";
import { makeGfycatService } from "./services/GfycatService";
import { makeNadeRepoFirebase } from "./nade/NadeRepoFirebase";
import { makePersistedStorage } from "./storage/FirebaseFirestore";
import { makeImageStorageService } from "./services/ImageStorageService";
import { makeUserService } from "./user/UserService";
import { makeUserRouter } from "./user/UserRouter";
import { extractTokenMiddleware } from "./utils/AuthUtils";
import { sessionRoute } from "./utils/SessionRoute";

export const AppServer = (config: CSGNConfig) => {
  const app = express();

  // Express dependencies
  app.use(express.json({ limit: "3mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(passport.initialize());
  app.use(cookieParser(config.secrets.server_key));
  app.use(helmet());
  app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
  app.disable("x-powered-by");
  app.use(extractTokenMiddleware(config));

  // Storage
  const { database, bucket } = makePersistedStorage(config);

  // Repos
  const userRepo = makeUserRepo(database);
  const nadeRepo = makeNadeRepoFirebase(database);

  // Services
  const gfycatService = makeGfycatService(config);
  const steamService = makeSteamService(config);
  const imageStorageService = makeImageStorageService(bucket);
  const userService = makeUserService(userRepo, steamService);
  const nadeService = makeNadeService(
    nadeRepo,
    userService,
    imageStorageService,
    gfycatService
  );

  // Routers
  const nadeRouter = makeNadeRouter(config, nadeService, gfycatService);
  const steamRouter = makeSteamRouter(userService, passport, config);
  const userRouter = makeUserRouter(config, userRepo);

  app.use(nadeRouter);
  app.use(steamRouter);
  app.use(userRouter);

  app.get("/", (_, res) => {
    res.send("Hello :)");
  });

  // Called by client to set up session
  app.post("/initSession", sessionRoute);

  return app;
};

function main() {
  const config = makeConfig();
  const app = AppServer(config);

  const start = () => {
    const { port } = config.server;
    app.listen(port, () => console.log(`Listening on port ${port}`));
  };

  start();
}

main();
