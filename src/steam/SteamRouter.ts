import { CookieOptions, RequestHandler, Router } from "express";
import rateLimit from "express-rate-limit";
import { PassportStatic } from "passport";
import SteamStrategy from "passport-steam";
import { CSGNConfig } from "../config/enironment";
import { Logger } from "../logger/Logger";
import { UserService } from "../user/UserService";
import { createAppContext } from "../utils/AppContext";
import {
  createAccessToken,
  createRefreshToken,
  payloadFromToken,
} from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import { sanitizeIt } from "../utils/Sanitize";

type PassPortDone = (err: any, id?: string) => void;

export class SteamRouter {
  public router: Router;
  private passport: PassportStatic;
  private config: CSGNConfig;
  private userService: UserService;

  constructor(
    passport: PassportStatic,
    config: CSGNConfig,
    userService: UserService
  ) {
    this.passport = passport;
    this.config = config;
    this.userService = userService;
    const rateLimiter = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minutes
      max: 5,
      onLimitReached: (_req) => {
        Logger.warning("SteamRouter rate limited");
      },
    });

    this.router = Router({ mergeParams: true });
    this.passport.serializeUser(this.serializeUser);
    this.passport.deserializeUser(this.deserializeUser);
    this.passport.use(this.steamStrategy());
    this.router.get(
      "/auth/steam",
      this.passport.authenticate("steam"),
      this.authSteam
    );
    this.router.get(
      "/auth/steam/return",
      rateLimiter,
      this.steamReturnHandlerUrlFixMiddleware,
      this.passport.authenticate("steam", {
        session: false,
        failureRedirect: "/",
      }),
      this.steamReturnHandler
    );
    this.router.get("/auth/refresh", rateLimiter, this.refreshToken);
    this.router.post("/auth/signout", rateLimiter, this.signOut);
  }

  private signOut: RequestHandler = (_req, res) => {
    const { config } = this;
    Logger.verbose("SteamRouter.signOut", _req);
    res.clearCookie("csgonadestoken", makeCookieOptions(config));
    return res.status(202).send();
  };

  private refreshToken: RequestHandler = async (req, res) => {
    const { config, userService } = this;
    try {
      const csgonadestoken = req.signedCookies.csgonadestoken as string;

      const payload = payloadFromToken(
        config.secrets.server_key,
        csgonadestoken
      );

      const context = createAppContext(req);

      const user = await userService.byId(context, payload.steamId);

      if (!user) {
        Logger.error("Expected to find user to refresh token");
        throw ErrorFactory.NotFound("Expected user not found to refresh token");
      }

      const accessToken = createAccessToken(config.secrets.server_key, user);
      const refreshToken = createRefreshToken(config.secrets.server_key, user);

      res.cookie("csgonadestoken", refreshToken, makeCookieOptions(config));

      await userService.updateActivity(user.steamId);

      Logger.verbose("SteamRouter.refreshToken", user.steamId);

      return res.status(200).send({ accessToken });
    } catch (error) {
      res.clearCookie("csgonadestoken");
      return res.status(401).send({ error: "Expired to invalid cookie" });
    }
  };

  private steamReturnHandlerUrlFixMiddleware: RequestHandler = (
    req,
    _res,
    next
  ) => {
    req.url = req.originalUrl;
    next();
  };

  private steamReturnHandler: RequestHandler = async (req, res) => {
    const { config, userService } = this;
    try {
      const dirtySteamId = req.user as string;
      let steamId = sanitizeIt(dirtySteamId);

      const user = await userService.getOrCreate(steamId);

      if (!user) {
        throw ErrorFactory.InternalServerError(
          "Failed to get or create user when authenticating"
        );
      }

      const refreshToken = createRefreshToken(config.secrets.server_key, user);

      res.cookie("csgonadestoken", refreshToken, makeCookieOptions(config));
      Logger.verbose("SteamRouter.login", user.nickname);

      res.redirect(`${config.client.baseUrl}/auth`);
    } catch (error) {
      Logger.error(error);
      res.redirect(config.client.baseUrl);
    }
  };

  private authSteam: RequestHandler = (req) => {
    Logger.verbose("SteamRouter.auth", req);
  };

  private steamStrategy(): SteamStrategy {
    return new SteamStrategy(
      {
        returnURL: `${this.config.server.baseUrl}/auth/steam/return`,
        realm: this.config.server.baseUrl,
        apiKey: this.config.secrets.steam_api_key,
      },
      function (_, profile, done) {
        return done(null, profile.id);
      }
    );
  }

  private serializeUser = (steamId: string, done: PassPortDone) => {
    done(null, steamId);
  };

  private deserializeUser = (steamId: string, done: PassPortDone) => {
    done(null, steamId);
  };
}

function makeCookieOptions(config: CSGNConfig): CookieOptions {
  const oneDay = 1000 * 60 * 60 * 24;

  if (config.isProduction) {
    return {
      httpOnly: true,
      secure: true,
      maxAge: oneDay * 60,
      signed: true,
      path: "/",
      domain: ".csgonades.com",
    };
  }

  return {
    httpOnly: true,
    secure: false,
    maxAge: oneDay,
    signed: true,
    path: "/",
  };
}
