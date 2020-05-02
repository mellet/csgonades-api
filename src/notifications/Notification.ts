interface CommonNotificationValues {
  subjectSteamId: string; // Reciever of notification
  viewed: boolean;
  createdAt: Date;
}

interface NewCommentNotification extends CommonNotificationValues {
  type: "new-comment";
  nadeId: string;
  nadeSlug?: string;
  bySteamId: string;
  byNickname: string;
  thumnailUrl?: string;
}

interface AcceptedNadeNotification extends CommonNotificationValues {
  type: "accepted-nade";
  nadeId: string;
  thumnailUrl?: string;
}

interface DeclinedNadeNotification extends CommonNotificationValues {
  type: "declined-nade";
  nadeId: string;
  thumnailUrl?: string;
}

export interface FavoriteNotification extends CommonNotificationValues {
  type: "favorite";
  nadeId: string;
  nadeSlug?: string;
  bySteamId: string;
  byNickname: string;
  thumnailUrl?: string;
}

interface ReportNotification extends CommonNotificationValues {
  type: "report";
}

interface NewContactNotification extends CommonNotificationValues {
  type: "contact-msg";
}

interface NewNadeNotification extends CommonNotificationValues {
  type: "new-nade";
  nadeId: string;
}

export type NotificationModel =
  | AcceptedNadeNotification
  | DeclinedNadeNotification
  | FavoriteNotification
  | ReportNotification
  | NewContactNotification
  | NewNadeNotification
  | NewCommentNotification;

export type NotificationDTO = NotificationModel & { id: string };

export type NotificationCreate = DistributiveOmit<
  NotificationDTO,
  "createdAt" | "id" | "viewed" | "count"
>;

// Helper to omit type from Union
type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;
