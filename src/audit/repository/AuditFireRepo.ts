import {
  add,
  collection,
  Collection,
  Doc,
  limit,
  order,
  query,
  value,
} from "typesaurus";
import { AuditDto } from "../dto/AuditDto";
import { AuditModel } from "../dto/AuditModel";
import { CreateAuditDto } from "../dto/CreateAuditDto";
import { AuditRepo } from "./AuditRepo";

export class AuditFireRepo implements AuditRepo {
  private collection: Collection<AuditModel>;

  constructor() {
    this.collection = collection("audit");
  }

  getAuditEvents = async (): Promise<AuditDto[]> => {
    const docs = await query(this.collection, [
      order("createdAt", "desc"),
      limit(20),
    ]);
    const auditEvents = docs.map(this.docToDto);

    return auditEvents;
  };

  createAuditEvent = async (data: CreateAuditDto): Promise<AuditDto> => {
    const newAuditEvent: AuditModel = {
      ...data,
      createdAt: value("serverDate"),
    };
    const res = await add(this.collection, newAuditEvent);

    return this.docToDto(res);
  };

  private docToDto = (doc: Doc<AuditModel>): AuditDto => {
    return {
      ...doc.data,
      id: doc.ref.id,
    };
  };
}
