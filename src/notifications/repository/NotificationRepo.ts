import { CommentDto } from "../../comment/dto/CommentDto";
import { NadeDto } from "../../nade/dto/NadeDto";
import { UserDto } from "../../user/UserDTOs";
import { NotificationCreateDto, NotificationDTO } from "../Notification";

export type RemoveFavNotiOpts = {
  nadeId: string;
  bySteamId: string;
};

export interface NotificationRepo {
  forUser(steamId: string): Promise<NotificationDTO[]>;
  byId(id: string): Promise<NotificationDTO | null>;
  newNade(nadeId: string): Promise<void>;
  newReport: () => Promise<void>;
  nadeAccepted: (nade: NadeDto) => Promise<void>;
  nadeDeclined: (nade: NadeDto) => Promise<void>;
  newFavorite: (nade: NadeDto, user: UserDto) => Promise<void>;
  newContactMessage: () => Promise<void>;
  newCommentNotification: (comment: CommentDto, nade: NadeDto) => Promise<void>;
  add: (noti: NotificationCreateDto) => Promise<NotificationDTO>;
  removeFavoriteNotification: (opts: RemoveFavNotiOpts) => Promise<void>;
  markAsViewed: (id: string) => Promise<void>;
  markAllAsViewed: (steamId: string) => Promise<void>;
}
