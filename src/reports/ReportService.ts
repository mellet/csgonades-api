import moment from "moment";
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

    this.deleteOldReports();
  }

  private deleteOldReports = async () => {
    const reports = await this.reportRepo.getAll();
    const oldReports = reports.filter((report) => {
      const addedDaysAgo = moment().diff(
        moment(report.createdAt),
        "days",
        false
      );
      return addedDaysAgo > 30;
    });

    oldReports.forEach((report) => {
      this.delete(report.id);
    });
  };

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
