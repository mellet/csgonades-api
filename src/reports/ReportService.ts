import { NotificationRepo } from "../notifications/repository/NotificationRepo";
import { ReportDto, ReportSaveDto } from "./Report";
import { ReportFireRepo } from "./reposityory/ReportFireRepo";

type ReportServiceDeps = {
  reportRepo: ReportFireRepo;
  notificationRepo: NotificationRepo;
};

export class ReportService {
  private reportRepo: ReportFireRepo;
  private notificationRepo: NotificationRepo;

  constructor(deps: ReportServiceDeps) {
    this.notificationRepo = deps.notificationRepo;
    this.reportRepo = deps.reportRepo;
  }

  getAll = async (): Promise<ReportDto[]> => {
    return this.reportRepo.getAll();
  };

  save = async (saveDto: ReportSaveDto): Promise<ReportDto | null> => {
    const report = await this.reportRepo.save(saveDto);
    this.notificationRepo.newReport();
    return report;
  };

  delete = async (id: string) => {
    return this.reportRepo.delete(id);
  };
}
