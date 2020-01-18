type NotificationType =
  | "accepted-nade"
  | "favorited-nade"
  | "declined-nade"
  | "new-report"
  | "new-contact-msg"
  | "new-nade";

export interface NotificationModel {
  steamId: string;
  type: NotificationType;
  entityId: string;
  hasBeenViewed: boolean;
  createdAt: Date;
}

export interface NotificationDTO extends NotificationModel {
  id: string;
}

export interface NotificationAddDto {
  steamId: string;
  type: NotificationType;
  entityId: string;
}
