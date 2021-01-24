import { UserAudit } from "./UserAudit";

export type EventName = "updateNade";

export type AuditModel = {
  byUser: UserAudit;
  createdAt: Date;
  name: EventName;
  description: string;
  onNadeId: string;
};
