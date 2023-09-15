import { Logger } from "../logger/Logger";
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

  getAuditEvents = async (): Promise<AuditDto[]> => {
    const audits = await this.auditRepo.getAuditEvents();
    Logger.verbose("AuditService.getAuditEvents", audits.length);
    return audits.filter((audit) => audit.byUser.role !== "administrator");
  };

  createAuditEvent = async (data: CreateAuditDto): Promise<void> => {
    await this.auditRepo.createAuditEvent(data);
    Logger.verbose("AuditService.createAuditEvent");
  };
}
