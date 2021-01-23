import { RequestUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import { NotificationRepo } from "./NotificationRepo";

type NotificationServiceDeps = {
  notificationRepo: NotificationRepo;
};

export class NotificationService {
  private notiRepo: NotificationRepo;

  constructor(deps: NotificationServiceDeps) {
    this.notiRepo = deps.notificationRepo;
  }

  forUser = (steamId: string) => {
    return this.notiRepo.forUser(steamId);
  };

  markAsRead = async (id: string, user: RequestUser) => {
    const noti = await this.notiRepo.byId(id);

    if (!noti) {
      throw ErrorFactory.NotFound("Notification not found.");
    }

    if (noti.subjectSteamId !== user.steamId) {
      throw ErrorFactory.Forbidden("This notification does not belong to you.");
    }

    return this.notiRepo.markAsViewed(id);
  };
}
