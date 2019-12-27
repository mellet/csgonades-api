import express from "express";
import helmet from "helmet";
import passport from "passport";
import { makeConfig, CSGNConfig } from "./config/enironment";
import cookieParser from "cookie-parser";
import { makeNadeRouter } from "./nade/NadeRouter";
import { makeSteamRouter } from "./steam/SteamRouter";
import cors from "cors";
import { makeGfycatService } from "./services/GfycatService";
import { makePersistedStorage } from "./storage/FirebaseFirestore";
import { makeImageStorageService } from "./services/ImageStorageService";
import { makeUserRouter } from "./user/UserRouter";
import { extractTokenMiddleware } from "./utils/AuthUtils";
import { sessionRoute } from "./utils/SessionRoute";
import { makeStatusRouter } from "./status/StatusRouter";
import { NadeRepoFirebase } from "./nade/NadeRepoFirebase";
import { NadeService } from "./nade/NadeService";
import { SteamService } from "./steam/SteamService";
import { UserRepo } from "./user/UserRepoFirebase";
import { UserService } from "./user/UserService";
import { makeFavoriteRouter } from "./favorite/FavoriteRouter";
import { FavoriteService } from "./favorite/FavoriteService";
import { FavoriteRepo } from "./favorite/FavoriteRepo";

export const AppServer = (config: CSGNConfig) => {
  const app = express();

  // Express dependencies
  app.use(express.json({ limit: "3mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(passport.initialize());
  app.use(cookieParser(config.secrets.server_key));
  app.use(helmet());
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://beta.csgonades.com",
        "https://www.csgonades.com"
      ],
      credentials: true
    })
  );
  app.disable("x-powered-by");
  app.use(extractTokenMiddleware(config));

  // Storage
  const { database, bucket } = makePersistedStorage(config);

  // Repos
  const userRepo = new UserRepo(database);
  const nadeRepo = new NadeRepoFirebase(database);
  const favoriteRepo = new FavoriteRepo(database);

  // Services
  const gfycatService = makeGfycatService(config);
  const steamService = new SteamService(config);
  const imageStorageService = makeImageStorageService(bucket);
  const userService = new UserService(userRepo, steamService);
  const nadeService = new NadeService(
    nadeRepo,
    userService,
    imageStorageService,
    gfycatService
  );
  const favoriteService = new FavoriteService(favoriteRepo);

  // Routers
  const statusRouter = makeStatusRouter(config);
  const nadeRouter = makeNadeRouter(config, nadeService, gfycatService);
  const steamRouter = makeSteamRouter(userService, passport, config);
  const userRouter = makeUserRouter(config, userRepo);
  const favoriteRouter = makeFavoriteRouter(favoriteService);

  app.use(nadeRouter);
  app.use(steamRouter);
  app.use(userRouter);
  app.use(statusRouter);
  app.use(favoriteRouter);

  app.get("/", (_, res) => {
    res.send("");
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
