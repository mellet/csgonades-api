export interface ReportModel {
  nadeId: string;
  message: string;
}

export interface ReportDTO extends ReportModel {
  id: string;
}

export interface ReportSaveDTO {
  nadeId: string;
  message: string;
}