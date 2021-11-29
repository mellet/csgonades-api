import * as Sentry from "@sentry/node";
import { CookieOptions, Router } from "express";
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
import { sanitizeIt } from "../utils/Sanitize";

export const makeSteamRouter = (
  userService: UserService,
  passport: PassportStatic,
  config: CSGNConfig
): Router => {
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 2,
    onLimitReached: (req) => {
      console.log(
        "> /auth limit reached",
        req.ip,
        req.rateLimit.resetTime,
        req.rateLimit.current
      );
    },
  });

  const router = Router({ mergeParams: true });

  passport.serializeUser(function (steamId: string, done) {
    done(null, steamId);
  });

  passport.deserializeUser(async function (steamId: string, done) {
    done(null, steamId);
  });

  passport.use(
    new SteamStrategy(
      {
        returnURL: `${config.server.baseUrl}/auth/steam/return`,
        realm: config.server.baseUrl,
        apiKey: config.secrets.steam_api_key,
      },
      function (_, profile, done) {
        return done(null, profile.id);
      }
    )
  );

  router.get("/auth/steam", passport.authenticate("steam"), (req, res) => {
    // no-op
  });

  router.get(
    "/auth/steam/return",
    // Fix url
    function (req, _, next) {
      req.url = req.originalUrl;
      next();
    },
    passport.authenticate("steam", { session: false, failureRedirect: "/" }),
    async (req, res) => {
      try {
        const dirtySteamId = req.user as string;
        let steamId = sanitizeIt(dirtySteamId);

        const user = await userService.getOrCreate(steamId);

        const refreshToken = createRefreshToken(
          config.secrets.server_key,
          user
        );

        res.cookie("csgonadestoken", refreshToken, makeCookieOptions(config));

        res.redirect(`${config.client.baseUrl}/auth`);
      } catch (error) {
        Logger.error(error);
        Sentry.captureException(error);
        res.redirect(config.client.baseUrl);
      }
    }
  );

  router.get("/auth/refresh", limiter, async (req, res) => {
    try {
      const csgonadestoken = req.signedCookies.csgonadestoken as string;

      const payload = payloadFromToken(
        config.secrets.server_key,
        csgonadestoken
      );

      const context = createAppContext(req);

      const user = await userService.byId(context, payload.steamId);

      const accessToken = createAccessToken(config.secrets.server_key, user);
      const refreshToken = createRefreshToken(config.secrets.server_key, user);

      res.cookie("csgonadestoken", refreshToken, makeCookieOptions(config));

      await userService.updateActivity(user.steamId);

      return res.status(200).send({ accessToken });
    } catch (error) {
      res.clearCookie("csgonadestoken");
      return res.status(401).send({ error: "Expired to invalid cookie" });
    }
  });

  router.post("/auth/signout", limiter, (_, res) => {
    res.clearCookie("csgonadestoken", makeCookieOptions(config));
    return res.status(202).send();
  });

  return router;
};

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
