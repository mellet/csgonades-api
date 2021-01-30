import { ReportDto, ReportSaveDto } from "../Report";

export interface ReportRepo {
  getAll: () => Promise<ReportDto[]>;
  save: (saveDto: ReportSaveDto) => Promise<ReportDto>;
  delete: (id: string) => Promise<void>;
}
