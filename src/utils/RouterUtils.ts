import { RequestUser } from "./AuthUtils";
import { sanitizeIt } from "./Sanitize";

export const userFromRequest = (
  request: Express.Request
): RequestUser | undefined => {
  if (!request.user) {
    return;
  }

  const user = sanitizeIt(request.user) as RequestUser;

  return user;
};
