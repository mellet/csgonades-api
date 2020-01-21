import { FavoriteService } from "../favorite/FavoriteService";
import { NadeService } from "../nade/NadeService";
import { NotificationAddDto } from "./Notification";
import { NotificationService } from "./NotificationService";

type NotificationGeneratorServiceDeps = {
  notificationService: NotificationService;
  favoriteService: FavoriteService;
  nadeService: NadeService;
};

export class NotificationGeneratorService {
  private notificationService: NotificationService;
  private favoriteService: FavoriteService;
  private nadeService: NadeService;

  constructor(deps: NotificationGeneratorServiceDeps) {
    this.notificationService = deps.notificationService;
    this.favoriteService = deps.favoriteService;
    this.nadeService = deps.nadeService;
  }

  // Ran by CRON once a day
  generateNewFavoriteNotifications = async () => {
    const newFavorites = await this.favoriteService.getTodaysFavorites();

    let notifications: NotificationAddDto[] = [];

    for (let favorite of newFavorites) {
      const notification = notifications.find(
        a => a.entityId === favorite.nadeId
      );

      // Check if we allready have this nade and increment count in this case
      if (notification && notification.count) {
        const other = notifications.filter(a => a.entityId !== favorite.nadeId);
        notification.count += 1;
        notifications = [...other, notification];
      } else {
        const nadeForFavorite = await this.nadeService.byId(favorite.nadeId);
        const newNoti: NotificationAddDto = {
          entityId: favorite.nadeId,
          steamId: nadeForFavorite.steamId,
          type: "favorited-nade",
          count: 1
        };
        notifications = [...notifications, newNoti];
      }
    }

    for (let noti of notifications) {
      this.notificationService.addOrUpdateFavNotification(
        noti.entityId,
        noti.steamId,
        noti.count
      );
    }
  };
}
