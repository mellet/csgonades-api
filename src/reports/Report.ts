import { NadeMiniDto } from "../nade/dto/NadeMiniDto";
import { UserMiniDto } from "../user/UserDTOs";

type ReportStatus = "new" | "resolved" | "ignored";

export interface ReportModel {
  createdAt: Date;
  message: string;
  nadeId: string;
  status?: ReportStatus;
  user?: UserMiniDto;
  nade?: NadeMiniDto;
}

export interface ReportDto extends ReportModel {
  id: string;
}

export interface ReportSaveDto {
  message: string;
  nadeId: string;
}
