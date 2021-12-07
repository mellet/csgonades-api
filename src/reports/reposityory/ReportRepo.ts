import { ReportDto, ReportSaveDto } from "../Report";

export interface ReportRepo {
  byId: (id: string) => Promise<ReportDto | null>;
  getAll: () => Promise<ReportDto[]>;
  save: (saveDto: ReportSaveDto) => Promise<ReportDto | null>;
  delete: (id: string) => Promise<void>;
}
