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
  where
} from "typesaurus";
import { assertNever } from "../utils/Common";
import { ErrorFactory } from "../utils/ErrorUtil";
import {
  FavoriteNotification,
  NotificationCreate,
  NotificationDTO,
  NotificationModel
} from "./Notification";

export class NotificationRepo {
  private collection: Collection<NotificationModel>;

  constructor() {
    this.collection = collection("notifications");
  }

  forUser = async (steamId: string) => {
    const notisForUserDocs = await query(this.collection, [
      where("subjectSteamId", "==", steamId)
    ]);

    const notisForUser = notisForUserDocs.map(this.toDto);

    return notisForUser;
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

  removeFavoriteNotification = async (nadeId: string) => {
    // See if there is a excisting notifciation for this nade that has not been viewed
    const foundNotification = await query<FavoriteNotification>(
      this.collection,
      [
        where("type", "==", "favorite"),
        where("nadeId", "==", nadeId),
        where("viewed", "==", false)
      ]
    );

    if (!foundNotification.length) {
      return;
    }

    const notification = foundNotification[0];

    const notificationId = notification.ref.id;
    const notificationCount = notification.data.count;

    if (notificationCount <= 1) {
      await remove(this.collection, notificationId);
    } else {
      await update(this.collection, notificationId, {
        count: notificationCount - 1
      });
    }
  };

  private addOfType = (
    noti: NotificationCreate
  ): Promise<Doc<NotificationModel>> => {
    const commonValues = {
      viewed: false,
      createdAt: value("serverDate"),
      subjectSteamId: noti.subjectSteamId
    };
    switch (noti.type) {
      case "accepted-nade":
        return add(this.collection, {
          ...commonValues,
          type: noti.type,
          nadeId: noti.nadeId
        });
      case "contact-msg":
        return add(this.collection, { ...commonValues, type: "contact-msg" });
      case "declined-nade":
        return add(this.collection, {
          ...commonValues,
          type: "declined-nade",
          nadeId: noti.nadeId
        });
      case "favorite":
        return this.addOrUpdateFavoriteNotification(noti);
      case "report":
        return add(this.collection, { ...commonValues, type: "report" });
      case "new-nade":
        return add(this.collection, {
          ...commonValues,
          type: "new-nade",
          nadeId: noti.nadeId
        });
      default:
        throw assertNever(noti);
    }
  };

  private addOrUpdateFavoriteNotification = async (
    noti: NotificationCreate
  ): Promise<Doc<NotificationModel>> => {
    if (noti.type !== "favorite") {
      throw ErrorFactory.InternalServerError(
        "Got wront notification type when trying to add favorite notification."
      );
    }

    const duplicateSearch = await query<FavoriteNotification>(this.collection, [
      where("type", "==", "favorite"),
      where("subjectSteamId", "==", noti.subjectSteamId),
      where("viewed", "==", false)
    ]);

    // If found, increment counter, otherwise add new document
    if (duplicateSearch.length) {
      const duplicate = duplicateSearch[0];
      await update(this.collection, duplicate.ref.id, {
        count: duplicate.data.count + 1,
        createdAt: value("serverDate")
      });

      const updatedModel = await get(this.collection, duplicate.ref.id);

      if (!updatedModel) {
        throw ErrorFactory.InternalServerError(
          "Could not find the updated notification"
        );
      }

      return updatedModel;
    } else {
      return add(this.collection, {
        type: "favorite",
        count: 1,
        createdAt: value("serverDate"),
        nadeId: noti.nadeId,
        subjectSteamId: noti.subjectSteamId,
        viewed: false
      });
    }
  };

  markAsViewed = async (id: string) => {
    update(this.collection, id, { viewed: true });
  };

  cleanStaleNotification = async () => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const staleNotification = await query(this.collection, [
      where("createdAt", ">", twoMonthsAgo)
    ]);

    const { remove, commit } = batch();

    for (let staleNoti of staleNotification) {
      console.log("> Remove stale", staleNoti.data);
      remove(this.collection, staleNoti.ref.id);
    }

    await commit();
  };

  private toDto = (doc: Doc<NotificationModel>): NotificationDTO => {
    const favId = doc.ref.id;
    const fav = doc.data;
    return {
      ...fav,
      id: favId
    };
  };
}
