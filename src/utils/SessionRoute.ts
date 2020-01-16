import { CookieOptions, Request, Response } from "express";
import uniqid from "uniqid";

export function sessionRoute(req: Request, res: Response) {
  const sessionId = getSessionId(req);

  if (sessionId) {
    return res.status(200).send();
  }

  const id = uniqid();
  const oneDay = 1000 * 60 * 60 * 24;
  const config: CookieOptions = {
    httpOnly: true,
    maxAge: oneDay,
    signed: true
  };
  res.cookie("csgonadessession", id, config);
  return res.status(200).send();
}

export function getSessionId(req: Request): string | null {
  let id = null;

  if (req.signedCookies.csgonadessession) {
    id = req.signedCookies.csgonadessession;
  }

  return id;
}
