import * as Sentry from "@sentry/node";
import { FavoriteDTO } from "../favorite/Favorite";
import { NadeDTO } from "../nade/Nade";
import { NadeService } from "../nade/NadeService";
import { EventBus } from "../services/EventHandler";
import { RequestUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import { NotificationRepo } from "./NotificationRepo";

type NotificationServiceDeps = {
  notificationRepo: NotificationRepo;
  eventBus: EventBus;
  nadeService: NadeService;
};

export class NotificationService {
  private notiRepo: NotificationRepo;
  private eventBus: EventBus;
  private nadeService: NadeService;
  private adminId = "76561198026064832";

  constructor(deps: NotificationServiceDeps) {
    this.eventBus = deps.eventBus;
    this.notiRepo = deps.notificationRepo;
    this.nadeService = deps.nadeService;

    this.eventBus.subAcceptedNade(this.nadeAccepted);
    this.eventBus.subDeclinedNade(this.nadeDeclined);
    this.eventBus.subNewNade(this.newNade);
    this.eventBus.subNewFavorites(this.addFavoriteNotification);
    this.eventBus.subUnFavorite(this.onRemoveFavorite);
  }

  forUser = (steamId: string) => {
    return this.notiRepo.forUser(steamId);
  };

  private nadeAccepted = (nade: NadeDTO) => {
    return this.notiRepo.add({
      type: "accepted-nade",
      nadeId: nade.id,
      subjectSteamId: nade.steamId
    });
  };

  private nadeDeclined = (nade: NadeDTO) => {
    return this.notiRepo.add({
      type: "declined-nade",
      nadeId: nade.id,
      subjectSteamId: nade.steamId
    });
  };

  newReport = () => {
    return this.notiRepo.add({
      type: "report",
      subjectSteamId: this.adminId
    });
  };

  newContactMsg = () => {
    this.notiRepo.add({
      type: "contact-msg",
      subjectSteamId: this.adminId
    });
  };

  private newNade = (nade: NadeDTO) => {
    this.notiRepo.add({
      type: "new-nade",
      subjectSteamId: this.adminId,
      nadeId: nade.id
    });
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

  private addFavoriteNotification = async (favorite: FavoriteDTO) => {
    try {
      const nade = await this.nadeService.byId(favorite.nadeId);

      this.notiRepo.add({
        type: "favorite",
        subjectSteamId: nade.steamId,
        nadeId: nade.id,
        favoritedBy: [favorite.userId]
      });
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  private onRemoveFavorite = async (favorite: FavoriteDTO) => {
    try {
      const nade = await this.nadeService.byId(favorite.nadeId);
      this.notiRepo.removeFavoriteNotification({
        nadeId: nade.id,
        favoriterUserId: favorite.userId
      });
    } catch (error) {
      Sentry.captureException(error);
    }
  };
}
