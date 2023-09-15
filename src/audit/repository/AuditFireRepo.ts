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
import { AddModel } from "typesaurus/add";
import { Logger } from "../../logger/Logger";
import { ErrorFactory } from "../../utils/ErrorUtil";
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
    try {
      const docs = await query(this.collection, [
        order("createdAt", "desc"),
        limit(50),
      ]);
      const auditEvents = docs.map(this.docToDto);

      return auditEvents;
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to get audit events");
    }
  };

  createAuditEvent = async (data: CreateAuditDto): Promise<void> => {
    try {
      const newAuditEvent: AddModel<AuditModel> = {
        ...data,
        createdAt: value("serverDate"),
      };

      await add(this.collection, newAuditEvent);
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to create audit events");
    }
  };

  private docToDto = (doc: Doc<AuditModel>): AuditDto => {
    return {
      ...doc.data,
      id: doc.ref.id,
    };
  };
}
