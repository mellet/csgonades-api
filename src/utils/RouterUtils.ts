import { RequestUser } from "./AuthUtils";
import { sanitizeObject } from "./Sanitize";

export const userFromRequest = (
  request: Express.Request
): RequestUser | undefined => {
  if (!request.user) {
    return;
  }

  const user = sanitizeObject(request.user) as RequestUser;

  return user;
};
