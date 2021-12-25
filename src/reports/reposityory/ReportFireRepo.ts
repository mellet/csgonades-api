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
import { Logger } from "../../logger/Logger";
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

  save = async (saveDto: ReportSaveDto): Promise<ReportDto | null> => {
    const ref = await add(this.collection, {
      message: saveDto.message,
      nadeId: saveDto.nadeId,
      createdAt: value("serverDate"),
    });

    Logger.verbose(`ReportRepo.save()`);

    return this.byId(ref.id);
  };

  delete = async (id: string) => {
    Logger.verbose(`ReportRepo.delete()`);

    await remove(this.collection, id);
  };

  private toDto = (doc: Doc<ReportModel>): ReportDto => {
    return {
      ...doc.data,
      id: doc.ref.id,
    };
  };
}
