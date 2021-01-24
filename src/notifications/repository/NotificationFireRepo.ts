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
import { CommentDto } from "../../comment/dto/CommentDto";
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

  constructor() {
    this.collection = collection("notifications");
  }

  forUser = async (steamId: string) => {
    const notisForUserDocs = await query(this.collection, [
      where("subjectSteamId", "==", steamId),
    ]);

    const notisForUser = notisForUserDocs.map(this.toDto);

    await this.removeOldViewedNotification(notisForUser);

    return notisForUser;
  };

  byId = async (id: string): Promise<NotificationDTO | null> => {
    const notification = await get(this.collection, id);

    if (!notification) {
      return null;
    }

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
      thumnailUrl: nade.images.thumbnailUrl,
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
      thumnailUrl: nade.images.thumbnailUrl,
    });
  };

  add = async (noti: NotificationCreateDto): Promise<NotificationDTO> => {
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
    noti: NotificationCreateDto
  ): Promise<Doc<NotificationModel>> => {
    const commonValues = {
      viewed: false,
      createdAt: value("serverDate"),
      subjectSteamId: noti.subjectSteamId,
    };
    switch (noti.type) {
      case "accepted-nade":
        const acceptedModel: NotificationModel = {
          ...commonValues,
          type: noti.type,
          nadeId: noti.nadeId,
          thumnailUrl: noti.thumnailUrl,
        };
        return add(this.collection, removeUndefines(acceptedModel));
      case "contact-msg":
        return add(this.collection, { ...commonValues, type: "contact-msg" });
      case "declined-nade":
        const declinedModel: NotificationModel = {
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
  ): Promise<Doc<NotificationModel>> => {
    if (noti.type !== "favorite") {
      throw ErrorFactory.InternalServerError(
        "Got wront notification type when trying to add favorite notification."
      );
    }

    const model: NotificationModel = {
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
    const isOld = hoursAddedAgo > 1;

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
