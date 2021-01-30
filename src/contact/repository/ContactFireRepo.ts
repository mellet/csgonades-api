import {
  add,
  all,
  collection,
  Collection,
  Doc,
  remove,
  value,
} from "typesaurus";
import { ContactDto } from "../dto/ContactDto";
import { ContactModel } from "../dto/ContactModel";
import { ContactSaveDto } from "../dto/ContactSaveDto";
import { ContactRepo } from "./ContactRepo";

export class ContactFireRepo implements ContactRepo {
  private collection: Collection<ContactModel>;

  constructor() {
    this.collection = collection("contact");
  }

  getMessages = async (): Promise<ContactDto[]> => {
    const docs = await all(this.collection);
    const messages = docs.map(this.docToDto);
    return messages;
  };

  saveMessage = async (data: ContactSaveDto): Promise<ContactDto> => {
    const newMessage: ContactModel = {
      ...data,
      createdAt: value("serverDate"),
    };
    const res = await add(this.collection, newMessage);

    return this.docToDto(res);
  };

  deleteMessage = async (id: string): Promise<void> => {
    await remove(this.collection, id);
  };

  private docToDto = (doc: Doc<ContactModel>): ContactDto => {
    return {
      ...doc.data,
      id: doc.ref.id,
    };
  };
}
