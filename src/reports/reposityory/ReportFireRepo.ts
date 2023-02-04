import {
  add,
  all,
  Collection,
  collection,
  Doc,
  get,
  remove,
  value,
} from "typesaurus";
import { AddModel } from "typesaurus/add";
import { Logger } from "../../logger/Logger";
import { UserMiniDto } from "../../user/UserDTOs";
import { removeUndefines } from "../../utils/Common";
import { ReportDto, ReportModel, ReportSaveDto } from "../Report";
import { ReportRepo } from "./ReportRepo";

export class ReportFireRepo implements ReportRepo {
  private collection: Collection<ReportModel>;

  constructor() {
    this.collection = collection("reports");
  }

  byId = async (id: string) => {
    const report = await get(this.collection, id);

    if (!report) {
      return null;
    }

    Logger.verbose(`ReportRepo.byId(${id}) | DB`);

    return this.toDto(report);
  };

  getAll = async (): Promise<ReportDto[]> => {
    const reports = await all(this.collection);
    Logger.verbose(`ReportRepo.getAll() -> ${reports.length} | DB`);

    return reports.map(this.toDto);
  };

  save = async (
    saveDto: ReportSaveDto,
    user?: UserMiniDto
  ): Promise<ReportDto | null> => {
    const reportSaveDto: AddModel<ReportModel> = {
      message: saveDto.message,
      nadeId: saveDto.nadeId,
      user,
      createdAt: value("serverDate"),
    };

    const ref = await add(this.collection, removeUndefines(reportSaveDto));

    Logger.verbose(`ReportRepo.save()`);

    return this.byId(ref.id);
  };

  delete = async (id: string) => {
    await remove(this.collection, id);
    Logger.verbose(`ReportRepo.delete(${id})`);
  };

  private toDto = (doc: Doc<ReportModel>): ReportDto => {
    return {
      ...doc.data,
      id: doc.ref.id,
    };
  };
}
