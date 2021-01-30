import { AuditDto } from "./dto/AuditDto";
import { CreateAuditDto } from "./dto/CreateAuditDto";
import { AuditRepo } from "./repository/AuditRepo";

export type AuditServiceDependencies = {
  auditRepo: AuditRepo;
};

export class AuditService {
  private auditRepo: AuditRepo;

  constructor(deps: AuditServiceDependencies) {
    this.auditRepo = deps.auditRepo;
  }

  getAuditEvents = (): Promise<AuditDto[]> => {
    return this.auditRepo.getAuditEvents();
  };

  createAuditEvent = async (data: CreateAuditDto): Promise<AuditDto> => {
    return this.auditRepo.createAuditEvent(data);
  };
}
