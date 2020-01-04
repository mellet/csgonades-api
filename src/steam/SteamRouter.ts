import { Router, CookieOptions } from "express";
import { PassportStatic } from "passport";
import SteamStrategy from "passport-steam";
import { CSGNConfig } from "../config/enironment";
import {
  createRefreshToken,
  createAccessToken,
  payloadFromToken
} from "../utils/AuthUtils";
import { UserModel } from "../user/UserModel";
import { sanitizeIt } from "../utils/Sanitize";
import { UserService } from "../user/UserService";
import * as Sentry from "@sentry/node";

export const makeSteamRouter = (
  userService: UserService,
  passport: PassportStatic,
  config: CSGNConfig
): Router => {
  const router = Router({ mergeParams: true });

  passport.serializeUser(function(steamId: string, done) {
    done(null, steamId);
  });

  passport.deserializeUser(async function(steamId: string, done) {
    done(null, steamId);
  });

  passport.use(
    new SteamStrategy(
      {
        returnURL: `${config.server.baseUrl}/auth/steam/return`,
        realm: config.server.baseUrl,
        apiKey: config.secrets.steam_api_key
      },
      function(_, profile, done) {
        return done(null, profile.id);
      }
    )
  );

  router.get("/auth/steam", passport.authenticate("steam"), (req, res) => {
    // no-op
  });

  router.get(
    "/auth/steam/return",
    passport.authenticate("steam", { session: false, failureRedirect: "/" }),
    async (req, res) => {
      try {
        const dirtySteamId = req.user as string;
        let steamId = sanitizeIt(dirtySteamId);

        const user = await userService.getOrCreate(steamId);

        let isFirstSignIn = checkIsFirstSignIn(user);

        const refreshToken = createRefreshToken(
          config.secrets.server_key,
          user
        );

        res.cookie("csgonadestoken", refreshToken, makeCookieOptions(config));

        res.redirect(
          `${config.client.baseUrl}/auth?isFirstSignIn=${isFirstSignIn}`
        );
      } catch (error) {
        Sentry.captureException(error);
      }
    }
  );

  router.get("/auth/refresh", async (req, res) => {
    try {
      const csgonadestoken = req.signedCookies.csgonadestoken as string;

      const payload = payloadFromToken(
        config.secrets.server_key,
        csgonadestoken
      );

      const user = await userService.byId(payload.steamId);

      if (!user) {
        return res
          .status(500)
          .send({ message: "Did not find a user for the token" });
      }

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

  router.post("/auth/signout", (_, res) => {
    res.clearCookie("csgonadestoken", makeCookieOptions(config));
    return res.status(202).send();
  });

  return router;
};

function checkIsFirstSignIn(user: UserModel): boolean {
  const ONE_MINUTE = 60 * 1000;
  const now = Date.now();
  const createdAt = user.createdAt.getTime() / 1000;

  if (now - createdAt < ONE_MINUTE) {
    return true;
  }

  return false;
}

function makeCookieOptions(config: CSGNConfig): CookieOptions {
  const oneDay = 1000 * 60 * 60 * 24;

  if (config.isProduction) {
    return {
      httpOnly: true,
      secure: true,
      maxAge: oneDay * 30,
      signed: true,
      path: "/",
      domain: ".csgonades.com"
    };
  }

  return {
    httpOnly: true,
    secure: false,
    maxAge: oneDay,
    signed: true,
    path: "/"
  };
}
