import { AppContext } from "../utils/AppContext";
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

  markAsRead = async (context: AppContext, id: string) => {
    const { authUser } = context;
    const noti = await this.notiRepo.byId(id);

    if (!noti) {
      throw ErrorFactory.NotFound("Notification not found.");
    }

    if (noti.subjectSteamId !== authUser?.steamId) {
      throw ErrorFactory.Forbidden("This notification does not belong to you.");
    }

    return this.notiRepo.markAsViewed(id);
  };
}
