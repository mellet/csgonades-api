export interface ReportModel {
  nadeId: string;
  message: string;
  createdAt: Date;
}

export interface ReportDto extends ReportModel {
  id: string;
}

export interface ReportSaveDto {
  nadeId: string;
  message: string;
}
