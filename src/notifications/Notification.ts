interface CommonNotificationValues {
  subjectSteamId: string; // Reciever of notification
  viewed: boolean;
  createdAt: Date;
}

interface AcceptedNadeNotification extends CommonNotificationValues {
  type: "accepted-nade";
  nadeId: string;
}

interface DeclinedNadeNotification extends CommonNotificationValues {
  type: "declined-nade";
  nadeId: string;
}

export interface FavoriteNotification extends CommonNotificationValues {
  type: "favorite";
  nadeId: string;
  count: number;
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
  | NewNadeNotification;

export type NotificationDTO = NotificationModel & { id: string };

export type NotificationCreate = DistributiveOmit<
  NotificationDTO,
  "createdAt" | "id" | "viewed" | "count"
>;

// Helper to omit type from Union
type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;
