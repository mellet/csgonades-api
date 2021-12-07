import {
  add,
  all,
  collection,
  Collection,
  Doc,
  remove,
  value,
} from "typesaurus";
import { AddModel } from "typesaurus/add";
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

  saveMessage = async (data: ContactSaveDto): Promise<void> => {
    const newMessage: AddModel<ContactModel> = {
      ...data,
      createdAt: value("serverDate"),
    };

    await add(this.collection, newMessage);
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
