import moment from "moment";
import {
  add,
  batch,
  Collection,
  collection,
  Doc,
  get,
  limit,
  query,
  Ref,
  remove,
  update,
  value,
  where,
} from "typesaurus";
import { AddModel } from "typesaurus/add";
import { ICache } from "../../cache/AppCache";
import { CommentDto } from "../../comment/dto/CommentDto";
import { Logger } from "../../logger/Logger";
import { NadeDto } from "../../nade/dto/NadeDto";
import { UserDto } from "../../user/UserDTOs";
import { assertNever, removeUndefines } from "../../utils/Common";
import { ErrorFactory } from "../../utils/ErrorUtil";
import {
  FavoriteNotification,
  NotificationCreateDto,
  NotificationDTO,
  NotificationModel,
} from "../Notification";
import { NotificationRepo, RemoveFavNotiOpts } from "./NotificationRepo";

export class NotificationFireRepo implements NotificationRepo {
  private collection: Collection<NotificationModel>;
  private adminId = "76561198026064832";
  private cache: ICache;

  constructor(cache: ICache) {
    this.collection = collection("notifications");
    this.cleanStaleNotification();
    this.cache = cache;
  }

  forUser = async (steamId: string) => {
    const cachedNotis = this.getFromCache(steamId);
    if (cachedNotis) {
      Logger.verbose(
        `NotificationRepo.forUser(${steamId}) -> ${cachedNotis.length} | CACHE`
      );
      return cachedNotis;
    }

    const notisForUserDocs = await query(this.collection, [
      where("subjectSteamId", "==", steamId),
    ]);

    const notisForUser = notisForUserDocs.map(this.toDto);

    await this.removeOldViewedNotification(notisForUser);

    Logger.verbose(
      `NotificationRepo.forUser(${steamId}) -> ${notisForUserDocs.length} | DB`
    );

    this.addToCache(steamId, notisForUser);

    return notisForUser;
  };

  byId = async (id: string): Promise<NotificationDTO | null> => {
    const notification = await get(this.collection, id);

    if (!notification) {
      return null;
    }

    Logger.verbose(`NotificationRepo.byId(${id}) | DB`);

    return this.toDto(notification);
  };

  newNade = async (nadeId: string) => {
    this.add({
      type: "new-nade",
      nadeId,
      subjectSteamId: this.adminId,
    });
  };

  newReport = async () => {
    this.add({
      type: "report",
      subjectSteamId: this.adminId,
    });
  };

  nadeAccepted = async (nade: NadeDto) => {
    this.add({
      type: "accepted-nade",
      nadeId: nade.id,
      subjectSteamId: nade.steamId,
    });
  };

  nadeDeclined = async (nade: NadeDto) => {
    this.add({
      type: "declined-nade",
      nadeId: nade.id,
      subjectSteamId: nade.steamId,
    });
  };

  newFavorite = async (nade: NadeDto, user: UserDto) => {
    this.add({
      type: "favorite",
      subjectSteamId: nade.steamId,
      nadeId: nade.id,
      bySteamId: user.steamId,
      byNickname: user.nickname,
      nadeSlug: nade.slug,
      thumnailUrl: nade.imageMain?.url,
    });
  };

  newContactMessage = async () => {
    this.add({
      type: "contact-msg",
      subjectSteamId: this.adminId,
    });
  };

  newCommentNotification = async (comment: CommentDto, nade: NadeDto) => {
    this.add({
      type: "new-comment",
      nadeId: comment.nadeId,
      byNickname: comment.nickname,
      bySteamId: comment.steamId,
      subjectSteamId: nade.steamId,
      nadeSlug: nade.slug,
      thumnailUrl: nade.imageMain?.url,
    });
  };

  add = async (
    noti: NotificationCreateDto
  ): Promise<NotificationDTO | null> => {
    const ref = await this.addOfType(noti);

    Logger.verbose(`NotificationRepo.add()`);
    this.clearCache(noti.subjectSteamId);

    return this.byId(ref.id);
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

    this.clearCache(bySteamId);

    Logger.verbose(
      `NotificationRepo.removeFavoriteNotification(${bySteamId}) -> ${foundNotification.length} | DB`
    );
  };

  public markAsViewed = async (id: string, subjectSteamId: string) => {
    update(this.collection, id, { viewed: true });
    this.clearCache(subjectSteamId);
  };

  public markAllAsViewed = async (steamId: string) => {
    const notificationsForUser = await query(this.collection, [
      where("subjectSteamId", "==", steamId),
    ]);

    const { update, commit } = batch();

    for (let notification of notificationsForUser) {
      update(this.collection, notification.ref.id, {
        viewed: true,
      });
    }

    await commit();

    this.clearCache(steamId);

    Logger.verbose(
      `NotificationRepo.markAllAsViewed(${steamId}) -> ${notificationsForUser.length} | DB`
    );
  };

  private addOfType = (
    noti: NotificationCreateDto
  ): Promise<Ref<NotificationModel>> => {
    const commonValues = {
      viewed: false,
      createdAt: value("serverDate"),
      subjectSteamId: noti.subjectSteamId,
    };
    switch (noti.type) {
      case "accepted-nade":
        const acceptedModel: AddModel<NotificationModel> = {
          ...commonValues,
          type: noti.type,
          nadeId: noti.nadeId,
          thumnailUrl: noti.thumnailUrl,
        };
        return add(this.collection, removeUndefines(acceptedModel));
      case "contact-msg":
        return add(this.collection, { ...commonValues, type: "contact-msg" });
      case "declined-nade":
        const declinedModel: AddModel<NotificationModel> = {
          ...commonValues,
          type: "declined-nade",
          nadeId: noti.nadeId,
          thumnailUrl: noti.thumnailUrl,
        };
        return add(this.collection, removeUndefines(declinedModel));
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
      case "new-comment":
        return add(
          this.collection,
          removeUndefines({
            ...commonValues,
            nadeId: noti.nadeId,
            type: "new-comment",
            thumnailUrl: noti.thumnailUrl,
            byNickname: noti.byNickname,
            bySteamId: noti.bySteamId,
            nadeSlug: noti.nadeSlug,
          })
        );
      default:
        throw assertNever(noti);
    }
  };

  private addFavoriteNotification = async (
    noti: NotificationCreateDto
  ): Promise<Ref<NotificationModel>> => {
    if (noti.type !== "favorite") {
      throw ErrorFactory.InternalServerError(
        "Got wront notification type when trying to add favorite notification."
      );
    }

    const model: AddModel<NotificationModel> = {
      type: "favorite",
      createdAt: value("serverDate"),
      nadeId: noti.nadeId,
      subjectSteamId: noti.subjectSteamId,
      viewed: false,
      bySteamId: noti.bySteamId,
      byNickname: noti.byNickname,
      nadeSlug: noti.nadeSlug,
      thumnailUrl: noti.thumnailUrl,
    };

    return add(this.collection, removeUndefines(model));
  };

  private cleanStaleNotification = async () => {
    const timeAgo = new Date();
    timeAgo.setMonth(timeAgo.getMonth() - 3);

    const staleNotification = await query(this.collection, [
      where("createdAt", "<", timeAgo),
      limit(500),
    ]);

    if (staleNotification.length === 0) {
      return;
    }

    const { remove, commit } = batch();

    for (let staleNoti of staleNotification) {
      remove(this.collection, staleNoti.ref.id);
    }

    await commit();
  };

  private removeOldViewedNotification = async (
    shouldRemove: NotificationDTO[]
  ) => {
    const removableNotification = shouldRemove.filter(this.shouldRemove);

    if (removableNotification.length) {
      const { remove, commit } = batch();

      for (let staleNotification of removableNotification) {
        remove(this.collection, staleNotification.id);
      }

      await commit();
    }
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

  private addToCache(steamId: string, notis: NotificationDTO[]) {
    const cacheKey = `notifications/${steamId}`;
    this.cache.set(cacheKey, notis);
  }

  private getFromCache(steamId: string) {
    const cacheKey = `notifications/${steamId}`;
    return this.cache.get<NotificationDTO[]>(cacheKey);
  }

  private clearCache(steamId: string) {
    const cacheKey = `notifications/${steamId}`;
    this.cache.del(cacheKey);
  }
}
