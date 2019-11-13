import { Router } from "express";
import { PassportStatic } from "passport";
import { User } from "../user/User";
import { UserRepo } from "../user/UserRepo";
import SteamStrategy from "passport-steam";
import { config } from "../config/enironment";

export const makeSteamRouter = (
  userRepo: UserRepo,
  passport: PassportStatic
) => {
  const router = Router();

  passport.serializeUser(function(user: User, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user: User, done) {
    done(null, user);
  });

  passport.use(
    new SteamStrategy(
      {
        returnURL: `http://localhost:${config.server.port}/auth/steam/return`,
        realm: `http://localhost:${config.server.port}/`,
        apiKey: process.env.STEAM_API_KEY
      },
      function(identified, profile, done) {
        const user: User = {
          steamID: profile._json.steamid
        };
        return done(null, user);
      }
    )
  );

  router.get("/auth/steam", passport.authenticate("steam"), (req, res) => {
    // no-op
  });

  router.get(
    "/auth/steam/return",
    passport.authenticate("steam", { failureRedirect: "/login" }),
    async (req, res) => {
      const sessionUser = req.user as User;
      let user: User | null = null;

      user = await userRepo.bySteamID(sessionUser.steamID);

      if (!user) {
        user = await userRepo.createUser(sessionUser);
      }

      const cookieConfig = {
        httpOnly: true,
        //secure: true,
        maxAge: 60000,
        signed: true
      };

      res.cookie("test", user.steamID, cookieConfig);

      res.redirect("/");
    }
  );

  return router;
};
