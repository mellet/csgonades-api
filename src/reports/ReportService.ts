import { ReportDTO, ReportSaveDTO } from "./Report";
import { ReportRepo } from "./ReportRepo";

export class ReportService {
  private reportRepo: ReportRepo;

  constructor(reportRepo: ReportRepo) {
    this.reportRepo = reportRepo;
  }

  getAll = async (): Promise<ReportDTO[]> => {
    return this.reportRepo.getAll();
  };

  save = async (saveDto: ReportSaveDTO): Promise<ReportDTO> => {
    return this.reportRepo.save(saveDto);
  };

  delete = async (id: string) => {
    return this.reportRepo.delete(id);
  };
}
