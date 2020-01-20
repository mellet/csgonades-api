import { RequestUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import { NotificationRepo } from "./NotificationRepo";

type NotificationServiceDeps = {
  notificationRepo: NotificationRepo;
};

export class NotificationService {
  private notiRepo: NotificationRepo;
  private adminId = "76561198026064832";

  constructor(deps: NotificationServiceDeps) {
    this.notiRepo = deps.notificationRepo;
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

  newReport = () => {
    return this.notiRepo.addNotification({
      steamId: this.adminId,
      type: "new-report",
      entityId: ""
    });
  };

  newContactMsg = () => {
    this.notiRepo.addNotification({
      steamId: this.adminId,
      type: "new-contact-msg",
      entityId: ""
    });
  };

  newNade = (nadeId: string) => {
    this.notiRepo.addNotification({
      steamId: this.adminId,
      type: "new-nade",
      entityId: nadeId
    });
  };

  addOrUpdateFavNotification = (
    nadeId: string,
    userId: string,
    count?: number
  ) => {
    this.notiRepo.addOrUpdateFavNotification({
      steamId: userId,
      type: "favorited-nade",
      entityId: nadeId,
      count
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
