import {
  add,
  all,
  Collection,
  collection,
  Doc,
  remove,
  value,
} from "typesaurus";
import { ReportDto, ReportModel, ReportSaveDto } from "../Report";

export class ReportFireRepo {
  private collection: Collection<ReportModel>;

  constructor() {
    this.collection = collection("reports");
  }

  getAll = async (): Promise<ReportDto[]> => {
    const reports = await all(this.collection);

    return reports.map(this.toDto);
  };

  save = async (saveDto: ReportSaveDto): Promise<ReportDto> => {
    const res = await add(this.collection, {
      message: saveDto.message,
      nadeId: saveDto.nadeId,
      createdAt: value("serverDate"),
    });

    return this.toDto(res);
  };

  delete = async (id: string) => {
    await remove(this.collection, id);
  };

  private toDto = (doc: Doc<ReportModel>): ReportDto => {
    return {
      ...doc.data,
      id: doc.ref.id,
    };
  };
}
