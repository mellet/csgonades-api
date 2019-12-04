import { RequestUser } from "./AuthUtils";

export const userFromRequest = (request: Express.Request): RequestUser => {
  const user = request.user as RequestUser;

  return user;
};
