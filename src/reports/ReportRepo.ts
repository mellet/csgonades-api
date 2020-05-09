import {
  add,
  all,
  Collection,
  collection,
  Doc,
  remove,
  value,
} from "typesaurus";
import { ReportDTO, ReportModel, ReportSaveDTO } from "./Report";

export class ReportRepo {
  private collection: Collection<ReportModel>;

  constructor() {
    this.collection = collection("reports");
  }

  getAll = async (): Promise<ReportDTO[]> => {
    const reports = await all(this.collection);

    return reports.map(this.toDto);
  };

  save = async (saveDto: ReportSaveDTO): Promise<ReportDTO> => {
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

  private toDto = (doc: Doc<ReportModel>): ReportDTO => {
    return {
      ...doc.data,
      id: doc.ref.id,
    };
  };
}
