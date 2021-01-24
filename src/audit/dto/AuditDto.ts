import { EventName } from "./AuditModel";
import { UserAudit } from "./UserAudit";

export type AuditDto = {
  id: string;
  byUser: UserAudit;
  createdAt: Date;
  name: EventName;
  description: string;
  onNadeId: string;
};
