import { UserModel } from "./UserModel";
import { UserDTO } from "./UserDTOs";
import { removeUndefines } from "../utils/Common";
import { RequestUser } from "../utils/AuthUtils";

export const userModelToDTO = (user: UserModel): UserDTO => {
  const converted: UserDTO = {
    steamID: user.steamId,
    nickname: user.nickname,
    avatar: user.avatar,
    email: user.email,
    bio: user.bio,
    role: user.role,
    createdAt: user.createdAt.toDate(),
    updatedAt: user.updatedAt.toDate(),
    lastActive: user.lastActive.toDate()
  };

  const cleaned = removeUndefines(converted);

  return cleaned;
};

export const desensitizeUser = (
  user: UserDTO,
  byUser: RequestUser | null
): UserDTO => {
  const rawUser = {
    ...user
  };

  if (shouldSkipDesensetize(user, byUser)) {
    return rawUser;
  }

  if (rawUser["email"]) {
    delete rawUser["email"];
  }

  return rawUser;
};

const shouldSkipDesensetize = (
  user: UserDTO,
  byUser?: RequestUser
): boolean => {
  if (!byUser) {
    return false;
  }

  if (user.steamID === byUser.steamId) {
    return true;
  }

  if (byUser.role === "administrator" || byUser.role === "moderator") {
    return true;
  }

  return false;
};
