import { collection, add, Collection, value, Doc, all } from "typesaurus";
import { ContactModel, ContactSaveDTO, ContactDTO } from "./ContactData";

export class ContactRepo {
  private collection: Collection<ContactModel>;

  constructor() {
    this.collection = collection("contact");
  }

  addMessage = async (data: ContactSaveDTO): Promise<ContactDTO> => {
    const newMessage: ContactModel = {
      ...data,
      createdAt: value("serverDate")
    };
    const res = await add(this.collection, newMessage);

    return this.docToDto(res);
  };

  getMessages = async (): Promise<ContactDTO[]> => {
    const docs = await all(this.collection);
    const messages = docs.map(this.docToDto);
    return messages;
  };

  private docToDto = (doc: Doc<ContactModel>): ContactDTO => {
    return {
      ...doc.data,
      id: doc.ref.id
    };
  };
}
