import { FavoriteService } from "../favorite/FavoriteService";
import { NotificationAddDto } from "./Notification";
import { NotificationService } from "./NotificationService";

type NotificationGeneratorServiceDeps = {
  notificationService: NotificationService;
  favoriteService: FavoriteService;
};

export class NotificationGeneratorService {
  private notificationService: NotificationService;
  private favoriteService: FavoriteService;

  constructor(deps: NotificationGeneratorServiceDeps) {
    this.notificationService = deps.notificationService;
    this.favoriteService = deps.favoriteService;
  }

  // Ran by CRON once a day
  generateNewFavoriteNotifications = async () => {
    const newFavorites = await this.favoriteService.getTodaysFavorites();

    const initialNotification: NotificationAddDto[] = [];

    const notifications: NotificationAddDto[] = newFavorites.reduce(
      (acc, cur) => {
        const found = acc.find(a => a.entityId == cur.nadeId);
        if (found && found.count) {
          const other = acc.filter(a => a.entityId !== cur.nadeId);
          found.count += 1;
          return [...other, found];
        } else {
          const newNoti: NotificationAddDto = {
            entityId: cur.nadeId,
            steamId: cur.userId,
            type: "favorited-nade",
            count: 1
          };
          return [...acc, newNoti];
        }
      },
      initialNotification
    );

    for (let noti of notifications) {
      this.notificationService.addOrUpdateFavNotification(
        noti.entityId,
        noti.steamId,
        noti.count
      );
    }
  };
}
