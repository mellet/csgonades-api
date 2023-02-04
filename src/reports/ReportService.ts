import moment from "moment";
import { NotificationRepo } from "../notifications/repository/NotificationRepo";
import { UserRepo } from "../user/repository/UserRepo";
import { UserMiniDto } from "../user/UserDTOs";
import { RequestUser } from "../utils/AuthUtils";
import { ReportDto, ReportSaveDto } from "./Report";
import { ReportFireRepo } from "./reposityory/ReportFireRepo";

type ReportServiceDeps = {
  reportRepo: ReportFireRepo;
  notificationRepo: NotificationRepo;
  userRepo: UserRepo;
};

export class ReportService {
  private reportRepo: ReportFireRepo;
  private notificationRepo: NotificationRepo;
  private userRepo: UserRepo;

  constructor(deps: ReportServiceDeps) {
    this.notificationRepo = deps.notificationRepo;
    this.reportRepo = deps.reportRepo;
    this.userRepo = deps.userRepo;
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

  save = async (
    saveDto: ReportSaveDto,
    requestUser?: RequestUser
  ): Promise<ReportDto | null> => {
    const user = await this.getUserIfPresent(requestUser);
    const report = await this.reportRepo.save(saveDto, user);
    this.notificationRepo.newReport();
    return report;
  };

  delete = async (reportId: string) => {
    return this.reportRepo.delete(reportId);
  };

  private async getUserIfPresent(
    requestUser?: RequestUser
  ): Promise<UserMiniDto | undefined> {
    if (!requestUser) {
      return;
    }

    const fullUser = await this.userRepo.byId(requestUser.steamId);

    if (fullUser) {
      return {
        nickname: fullUser.nickname,
        steamId: fullUser.steamId,
        avatar: fullUser.avatar,
        role: fullUser.role,
      };
    }
  }
}
