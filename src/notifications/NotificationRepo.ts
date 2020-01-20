import {
  add,
  batch,
  Collection,
  collection,
  Doc,
  get,
  query,
  update,
  value,
  where
} from "typesaurus";
import {
  NotificationAddDto,
  NotificationDTO,
  NotificationModel
} from "./Notification";

export class NotificationRepo {
  private collection: Collection<NotificationModel>;

  constructor() {
    this.collection = collection("notifications");
  }

  getNotificationForUser = async (
    steamId: string
  ): Promise<NotificationDTO[]> => {
    const notisForUserDocs = await query(this.collection, [
      where("steamId", "==", steamId),
      where("hasBeenViewed", "==", false)
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

  addNotification = async (
    noti: NotificationAddDto
  ): Promise<NotificationDTO> => {
    const res = await add(this.collection, {
      steamId: noti.steamId,
      hasBeenViewed: false,
      createdAt: value("serverDate"),
      type: noti.type,
      entityId: noti.entityId
    });

    return this.toDto(res);
  };

  addOrUpdateFavNotification = async (noti: NotificationAddDto) => {
    // Try finding the notification if it has not been seen
    const res = await query(this.collection, [
      where("entityId", "==", noti.entityId),
      where("steamId", "==", noti.steamId),
      where("hasBeenViewed", "==", false)
    ]);
    const found = res.length === 1;

    if (found) {
      const item = res[0];
      const oldCount = item.data.count || 0;
      const additionalCount = noti.count || 0;
      console.log("Found notification", { item, oldCount, additionalCount });

      update(this.collection, item.ref.id, {
        count: oldCount + additionalCount
      });
    } else {
      add(this.collection, {
        steamId: noti.steamId,
        hasBeenViewed: false,
        createdAt: value("serverDate"),
        type: "favorited-nade",
        entityId: noti.entityId,
        count: noti.count
      });
    }
  };

  markNotificationAsViewed = async (id: string) => {
    await update(this.collection, id, {
      hasBeenViewed: true
    });
  };

  cleanStaleNotification = async () => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const readNotification = await query(this.collection, [
      where("hasBeenViewed", "==", true)
    ]);

    const staleNotification = await query(this.collection, [
      where("createdAt", ">", twoMonthsAgo)
    ]);

    const { remove, commit } = batch();

    for (let readNoti of readNotification) {
      console.log("> Remove been read", readNoti.data);
      remove(this.collection, readNoti.ref.id);
    }

    for (let staleNoti of staleNotification) {
      console.log("> Remove stale", staleNoti.data);
      remove(this.collection, staleNoti.ref.id);
    }

    await commit();
  };

  private toDto = (doc: Doc<NotificationModel>): NotificationDTO => ({
    ...doc.data,
    id: doc.ref.id
  });
}
