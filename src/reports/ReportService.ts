import { NotificationRepo } from "../notifications/NotificationRepo";
import { ReportDTO, ReportSaveDTO } from "./Report";
import { ReportRepo } from "./ReportRepo";

type ReportServiceDeps = {
  reportRepo: ReportRepo;
  notificationRepo: NotificationRepo;
};

export class ReportService {
  private reportRepo: ReportRepo;
  private notificationRepo: NotificationRepo;

  constructor(deps: ReportServiceDeps) {
    this.notificationRepo = deps.notificationRepo;
    this.reportRepo = deps.reportRepo;
  }

  getAll = async (): Promise<ReportDTO[]> => {
    return this.reportRepo.getAll();
  };

  save = async (saveDto: ReportSaveDTO): Promise<ReportDTO> => {
    const report = await this.reportRepo.save(saveDto);
    this.notificationRepo.newReport();
    return report;
  };

  delete = async (id: string) => {
    return this.reportRepo.delete(id);
  };
}
