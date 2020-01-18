import { NotificationService } from "../notifications/NotificationService";
import { ReportDTO, ReportSaveDTO } from "./Report";
import { ReportRepo } from "./ReportRepo";

export class ReportService {
  private reportRepo: ReportRepo;
  private notificationService: NotificationService;

  constructor(
    reportRepo: ReportRepo,
    notificationService: NotificationService
  ) {
    this.reportRepo = reportRepo;
    this.notificationService = notificationService;
  }

  getAll = async (): Promise<ReportDTO[]> => {
    return this.reportRepo.getAll();
  };

  save = async (saveDto: ReportSaveDTO): Promise<ReportDTO> => {
    this.notificationService.newReport();
    return this.reportRepo.save(saveDto);
  };

  delete = async (id: string) => {
    return this.reportRepo.delete(id);
  };
}
