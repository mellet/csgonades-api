import moment from "moment";
import {
  add,
  batch,
  Collection,
  collection,
  Doc,
  get,
  query,
  remove,
  update,
  value,
  where,
} from "typesaurus";
import { assertNever } from "../utils/Common";
import { ErrorFactory } from "../utils/ErrorUtil";
import {
  FavoriteNotification,
  NotificationCreate,
  NotificationDTO,
  NotificationModel,
} from "./Notification";

type RemoveFavNotiOpts = {
  nadeId: string;
  bySteamId: string;
};

export class NotificationRepo {
  private collection: Collection<NotificationModel>;

  constructor() {
    this.collection = collection("notifications");
  }

  forUser = async (steamId: string) => {
    const notisForUserDocs = await query(this.collection, [
      where("subjectSteamId", "==", steamId),
    ]);

    const notisForUser = notisForUserDocs.map(this.toDto);

    const notifications = await this.removeOldViewedNotification(notisForUser);

    return notifications;
  };

  byId = async (id: string) => {
    const notification = await get(this.collection, id);

    if (!notification) {
      return null;
    }

    return this.toDto(notification);
  };

  add = async (noti: NotificationCreate): Promise<NotificationDTO> => {
    const res = await this.addOfType(noti);

    return this.toDto(res);
  };

  removeFavoriteNotification = async (opts: RemoveFavNotiOpts) => {
    const { bySteamId, nadeId } = opts;

    // Look for the notification
    const foundNotification = await query<FavoriteNotification>(
      this.collection,
      [
        where("type", "==", "favorite"),
        where("nadeId", "==", nadeId),
        where("bySteamId", "==", bySteamId),
        where("viewed", "==", false),
      ]
    );

    if (!foundNotification.length) {
      return;
    }

    const notification = foundNotification[0];
    const notificationId = notification.ref.id;

    await remove(this.collection, notificationId);
  };

  private addOfType = (
    noti: NotificationCreate
  ): Promise<Doc<NotificationModel>> => {
    const commonValues = {
      viewed: false,
      createdAt: value("serverDate"),
      subjectSteamId: noti.subjectSteamId,
    };
    switch (noti.type) {
      case "accepted-nade":
        return add(this.collection, {
          ...commonValues,
          type: noti.type,
          nadeId: noti.nadeId,
        });
      case "contact-msg":
        return add(this.collection, { ...commonValues, type: "contact-msg" });
      case "declined-nade":
        return add(this.collection, {
          ...commonValues,
          type: "declined-nade",
          nadeId: noti.nadeId,
        });
      case "favorite":
        return this.addFavoriteNotification(noti);
      case "report":
        return add(this.collection, { ...commonValues, type: "report" });
      case "new-nade":
        return add(this.collection, {
          ...commonValues,
          type: "new-nade",
          nadeId: noti.nadeId,
        });
      default:
        throw assertNever(noti);
    }
  };

  private addFavoriteNotification = async (
    noti: NotificationCreate
  ): Promise<Doc<NotificationModel>> => {
    if (noti.type !== "favorite") {
      throw ErrorFactory.InternalServerError(
        "Got wront notification type when trying to add favorite notification."
      );
    }

    return add(this.collection, {
      type: "favorite",
      createdAt: value("serverDate"),
      nadeId: noti.nadeId,
      subjectSteamId: noti.subjectSteamId,
      viewed: false,
      bySteamId: noti.bySteamId,
      byNickname: noti.byNickname,
      nadeSlug: noti.nadeSlug,
    });
  };

  markAsViewed = async (id: string) => {
    update(this.collection, id, { viewed: true });
  };

  cleanStaleNotification = async () => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const staleNotification = await query(this.collection, [
      where("createdAt", ">", twoMonthsAgo),
    ]);

    const { remove, commit } = batch();

    for (let staleNoti of staleNotification) {
      remove(this.collection, staleNoti.ref.id);
    }

    await commit();
  };

  private removeOldViewedNotification = async (
    shouldRemove: NotificationDTO[]
  ): Promise<NotificationDTO[]> => {
    const removableNotification = shouldRemove.filter(this.shouldRemove);
    const okNotifications = shouldRemove.filter((n) => !this.shouldRemove(n));

    if (removableNotification.length) {
      const { remove, commit } = batch();

      for (let staleNotification of removableNotification) {
        remove(this.collection, staleNotification.id);
      }

      await commit();
    }

    return okNotifications;
  };

  private shouldRemove = (notification: NotificationDTO) => {
    const hoursAddedAgo = moment().diff(
      moment(notification.createdAt),
      "hours",
      false
    );
    const isOld = hoursAddedAgo > 24;

    return isOld && notification.viewed;
  };

  private toDto = (doc: Doc<NotificationModel>): NotificationDTO => {
    const favId = doc.ref.id;
    const fav = doc.data;
    return {
      ...fav,
      id: favId,
    };
  };
}
