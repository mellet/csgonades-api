import { AuditDto } from "../dto/AuditDto";
import { CreateAuditDto } from "../dto/CreateAuditDto";

export interface AuditRepo {
  getAuditEvents: () => Promise<AuditDto[]>;
  createAuditEvent: (data: CreateAuditDto) => Promise<AuditDto>;
}
