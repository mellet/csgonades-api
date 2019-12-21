import { RequestUser } from "./AuthUtils";

export const userFromRequest = (
  request: Express.Request
): RequestUser | undefined => {
  if (!request.user) {
    return;
  }

  const user = request.user as RequestUser;

  return user;
};
