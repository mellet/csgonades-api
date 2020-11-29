import { AuditDto, CreateAuditDto } from "./AuditModel";
import { AuditRepo } from "./AuditRepo";

type ContactServiceDeps = {
  auditRepo: AuditRepo;
};

export class AuditService {
  private auditRepo: AuditRepo;

  constructor(deps: ContactServiceDeps) {
    this.auditRepo = deps.auditRepo;
  }

  getAuditEvents = (): Promise<AuditDto[]> => {
    return this.auditRepo.getAuditEvents();
  };

  createAuditEvent = async (data: CreateAuditDto): Promise<AuditDto> => {
    return this.auditRepo.createAuditEvent(data);
  };
}
