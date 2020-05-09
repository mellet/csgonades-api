import * as Sentry from "@sentry/node";
import { FavoriteDTO } from "../favorite/Favorite";
import { NadeDTO } from "../nade/Nade";
import { NadeService } from "../nade/NadeService";
import { NadeCommentDto } from "../nadecomment/NadeComment";
import { EventBus } from "../services/EventHandler";
import { UserService } from "../user/UserService";
import { RequestUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import { NotificationRepo } from "./NotificationRepo";

type NotificationServiceDeps = {
  notificationRepo: NotificationRepo;
  eventBus: EventBus;
  nadeService: NadeService;
  userService: UserService;
};

export class NotificationService {
  private notiRepo: NotificationRepo;
  private eventBus: EventBus;
  private nadeService: NadeService;
  private userService: UserService;
  private adminId = "76561198026064832";

  constructor(deps: NotificationServiceDeps) {
    this.eventBus = deps.eventBus;
    this.notiRepo = deps.notificationRepo;
    this.nadeService = deps.nadeService;
    this.userService = deps.userService;

    this.eventBus.subAcceptedNade(this.nadeAccepted);
    this.eventBus.subDeclinedNade(this.nadeDeclined);
    this.eventBus.subNewNade(this.newNade);
    this.eventBus.subNewFavorites(this.addFavoriteNotification);
    this.eventBus.subUnFavorite(this.onRemoveFavorite);
    this.eventBus.subNadeCommentCreate(this.addNewCommentNotification);
    this.eventBus.subNewReport(this.newReport);
  }

  forUser = (steamId: string) => {
    return this.notiRepo.forUser(steamId);
  };

  private nadeAccepted = (nade: NadeDTO) => {
    return this.notiRepo.add({
      type: "accepted-nade",
      nadeId: nade.id,
      subjectSteamId: nade.steamId,
    });
  };

  private nadeDeclined = (nade: NadeDTO) => {
    return this.notiRepo.add({
      type: "declined-nade",
      nadeId: nade.id,
      subjectSteamId: nade.steamId,
    });
  };

  newReport = () => {
    return this.notiRepo.add({
      type: "report",
      subjectSteamId: this.adminId,
    });
  };

  newContactMsg = () => {
    this.notiRepo.add({
      type: "contact-msg",
      subjectSteamId: this.adminId,
    });
  };

  private newNade = (nade: NadeDTO) => {
    this.notiRepo.add({
      type: "new-nade",
      subjectSteamId: this.adminId,
      nadeId: nade.id,
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

  private addNewCommentNotification = async (comment: NadeCommentDto) => {
    try {
      const nade = await this.nadeService.byId(comment.nadeId);

      // Ignore creating notifiation on own comment
      if (comment.steamId === nade.steamId) {
        return;
      }

      this.notiRepo.add({
        type: "new-comment",
        nadeId: comment.nadeId,
        byNickname: comment.nickname,
        bySteamId: comment.steamId,
        subjectSteamId: nade.steamId,
        nadeSlug: nade.slug,
        thumnailUrl: nade.images.thumbnailUrl,
      });
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  private addFavoriteNotification = async (favorite: FavoriteDTO) => {
    try {
      const nade = await this.nadeService.byId(favorite.nadeId);

      // Ignore sending notification if favoriting own nade

      if (favorite.userId === nade.steamId) {
        return;
      }

      const favoritingUser = await this.userService.byId(favorite.userId);

      this.notiRepo.add({
        type: "favorite",
        subjectSteamId: nade.steamId,
        nadeId: nade.id,
        bySteamId: favoritingUser.steamId,
        byNickname: favoritingUser.nickname,
        nadeSlug: nade.slug,
        thumnailUrl: nade.images.thumbnailUrl,
      });
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  private onRemoveFavorite = async (favorite: FavoriteDTO) => {
    try {
      const nade = await this.nadeService.byId(favorite.nadeId);

      // Ignore sending removeing notification if unfavoriting own nade
      if (favorite.userId === nade.steamId) {
        return;
      }

      this.notiRepo.removeFavoriteNotification({
        nadeId: nade.id,
        bySteamId: favorite.userId,
      });
    } catch (error) {
      Sentry.captureException(error);
    }
  };
}
