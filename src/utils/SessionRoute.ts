import { CookieOptions, Request, Response } from "express-serve-static-core";
import uniqid from "uniqid";

export function sessionRoute(req: Request, res: Response) {
  setSessionCookieIfNotPresent(req, res);

  const authenticated = isAuthenticated(req);

  return res.status(200).send({
    authenticated,
  });
}

export function getSessionId(req: Request): string | null {
  let id = null;

  if (req.signedCookies.csgonadessession) {
    id = req.signedCookies.csgonadessession;
  }

  return id;
}

function setSessionCookieIfNotPresent(req: Request, res: Response) {
  if (req.signedCookies.csgonadessession) {
    return;
  }

  const id = uniqid();
  const oneDay = 1000 * 60 * 60 * 24;
  const config: CookieOptions = {
    httpOnly: true,
    maxAge: oneDay,
    signed: true,
  };
  res.cookie("csgonadessession", id, config);
}

function isAuthenticated(req: Request) {
  if (req.signedCookies.csgonadestoken) {
    return true;
  }

  return false;
}
