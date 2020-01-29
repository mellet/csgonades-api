import { EventBus } from "../services/EventHandler";
import { ReportDTO, ReportSaveDTO } from "./Report";
import { ReportRepo } from "./ReportRepo";

type ReportServiceDeps = {
  reportRepo: ReportRepo;
  eventBus: EventBus;
};

export class ReportService {
  private reportRepo: ReportRepo;
  private eventBus: EventBus;

  constructor(deps: ReportServiceDeps) {
    this.reportRepo = deps.reportRepo;
    this.eventBus = deps.eventBus;
  }

  getAll = async (): Promise<ReportDTO[]> => {
    return this.reportRepo.getAll();
  };

  save = async (saveDto: ReportSaveDTO): Promise<ReportDTO> => {
    const report = await this.reportRepo.save(saveDto);
    this.eventBus.emitNewReport(report);

    return report;
  };

  delete = async (id: string) => {
    return this.reportRepo.delete(id);
  };
}
