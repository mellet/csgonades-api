import { NadeDTO } from "../nade/Nade";
import { EventBus } from "../services/EventHandler";
import { RequestUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import { NotificationRepo } from "./NotificationRepo";

type NotificationServiceDeps = {
  notificationRepo: NotificationRepo;
  eventBus: EventBus;
};

export class NotificationService {
  private notiRepo: NotificationRepo;
  private eventBus: EventBus;
  private adminId = "76561198026064832";

  constructor(deps: NotificationServiceDeps) {
    this.eventBus = deps.eventBus;
    this.notiRepo = deps.notificationRepo;

    this.eventBus.subAcceptedNade(this.nadeAccepted);
    this.eventBus.subDeclinedNade(this.nadeDeclined);
    this.eventBus.subNewNade(this.newNade);
  }

  forUser = (steamId: string) => {
    return this.notiRepo.getNotificationForUser(steamId);
  };

  private nadeAccepted = (nade: NadeDTO) => {
    return this.notiRepo.addNotification({
      steamId: nade.steamId,
      type: "accepted-nade",
      entityId: nade.id
    });
  };

  private nadeDeclined = (nade: NadeDTO) => {
    return this.notiRepo.addNotification({
      steamId: nade.steamId,
      type: "declined-nade",
      entityId: nade.id
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

  private newNade = (nade: NadeDTO) => {
    this.notiRepo.addNotification({
      steamId: this.adminId,
      type: "new-nade",
      entityId: nade.id
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
