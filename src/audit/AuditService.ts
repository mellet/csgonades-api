import { AuditDto } from "./dto/AuditDto";
import { CreateAuditDto } from "./dto/CreateAuditDto";
import { AuditRepo } from "./repository/AuditRepo";

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
