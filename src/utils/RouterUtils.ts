import { RequestUser } from "./AuthUtils";
import { sanitizeIt } from "./Sanitize";

export const userFromRequest = (request: Express.Request): RequestUser => {
  const user = sanitizeIt(request.user) as RequestUser;
  return user;
};

export const maybeUserFromRequest = (request: Express.Request) => {
  if (!request.user) {
    return;
  }
  const user = sanitizeIt(request.user) as RequestUser;
  return user;
};
