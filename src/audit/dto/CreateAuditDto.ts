import { EventName } from "./AuditModel";
import { UserAudit } from "./UserAudit";

export type CreateAuditDto = {
  byUser: UserAudit;
  name: EventName;
  description: string;
  onNadeId: string;
};
