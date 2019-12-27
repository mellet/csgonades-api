import { Router, CookieOptions } from "express";
import { PassportStatic } from "passport";
import SteamStrategy from "passport-steam";
import { CSGNConfig } from "../config/enironment";
import {
  createRefreshToken,
  createAccessToken,
  payloadFromToken
} from "../utils/AuthUtils";
import { IUserService } from "../user/UserService";
import { UserModel } from "../user/UserModel";
import { sanitizeString } from "../utils/Sanitize";

export const makeSteamRouter = (
  userService: IUserService,
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
      const dirtySteamId = req.user as string;
      let steamId = sanitizeString(dirtySteamId);

      const result = await userService.getOrCreateUser(steamId);

      if (result.isErr()) {
        console.error("Ops");
        throw result.error;
      }

      const user = result.value;

      let isFirstSignIn = checkIsFirstSignIn(user);

      const refreshToken = createRefreshToken(config.secrets.server_key, user);

      res.cookie("csgonadestoken", refreshToken, makeCookieOptions(config));

      res.redirect(
        `${config.client.baseUrl}/auth?isFirstSignIn=${isFirstSignIn}`
      );
    }
  );

  router.get("/auth/refresh", async (req, res) => {
    try {
      const csgonadestoken = req.signedCookies.csgonadestoken as string;
      const payload = payloadFromToken(
        config.secrets.server_key,
        csgonadestoken
      );

      const result = await userService.bySteamID(payload.steamId);

      if (result.isErr()) {
        console.error(result.error);
        return res.status(500).send(result.error);
      }

      const user = result.value;

      const accessToken = createAccessToken(config.secrets.server_key, user);
      const refreshToken = createRefreshToken(config.secrets.server_key, user);

      res.cookie("csgonadestoken", refreshToken, makeCookieOptions(config));
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
  const createdAt = user.createdAt.toDate().getTime() / 1000;

  if (now - createdAt < ONE_MINUTE) {
    return true;
  }

  return false;
}

function makeCookieOptions(config: CSGNConfig): CookieOptions {
  const oneDay = 1000 * 60 * 60 * 24;
  return {
    httpOnly: true,
    secure: config.isProduction,
    maxAge: oneDay,
    signed: true,
    path: "/"
  };
}
