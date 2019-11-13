import express, { Express } from "express";
import helmet from "helmet";
import passport, { PassportStatic } from "passport";
import { config } from "./config/enironment";
import cookieParser from "cookie-parser";
import { makeNadeRepo } from "./nade/NadeRepoFirebase";
import { makeNadeRouter } from "./nade/NadeRouter";
import { makeUserRepo } from "./user/UserRepoFirebase";
import { makeFirestore } from "./storage/FirebaseFirestore";
import { makeSteamRouter } from "./auth/SteamRouter";

class Server {
  private app: Express;
  private passport: PassportStatic;

  constructor(app: Express, passport: PassportStatic) {
    this.app = app;
    this.passport = passport;
    this.setupExpressDependencies();
    this.setupRouters();
  }

  setupExpressDependencies = () => {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(this.passport.initialize());
    this.app.use(cookieParser(config.secrets.server_key));
    this.app.use(helmet());
    this.app.disable("x-powered-by");
  };

  setupRouters = () => {
    const database = makeFirestore();
    const userRepo = makeUserRepo(database);
    const nadeRepo = makeNadeRepo(database);
    const nadeRouter = makeNadeRouter(nadeRepo);
    const steamRouter = makeSteamRouter(userRepo, this.passport);

    this.app.use(nadeRouter);
    this.app.use(steamRouter);

    this.app.get("/", (req, res) => {
      res.send("Hello World");
    });
  };

  start() {
    this.app.listen(config.server.port, () =>
      console.log(`Listening on port ${config.server.port}`)
    );
  }
}

function main() {
  const server = new Server(express(), passport);
  server.start();
}

main();
