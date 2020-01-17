import { RequestUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import { NotificationRepo } from "./NotificationRepo";

export class NotificationService {
  private notiRepo: NotificationRepo;

  constructor(notiRepo: NotificationRepo) {
    this.notiRepo = notiRepo;
  }

  forUser = (steamId: string) => {
    return this.notiRepo.getNotificationForUser(steamId);
  };

  nadeAccepted = (nadeId: string, userId: string) => {
    return this.notiRepo.addNotification({
      steamId: userId,
      type: "accepted-nade",
      entityId: nadeId
    });
  };

  nadeDeclined = (nadeId: string, userId: string) => {
    return this.notiRepo.addNotification({
      steamId: userId,
      type: "declined-nade",
      entityId: nadeId
    });
  };

  markAsRead = async (id: string, user: RequestUser) => {
    const noti = await this.notiRepo.byId(id);

    if (!noti) {
      throw ErrorFactory.NotFound("Notification not found.");
    }

    if (noti.steamId !== user.steamId) {
      throw ErrorFactory.Forbidden("This notification does not belong to you.");
    }

    return this.notiRepo.markNotificationAsViewed(id);
  };
}
