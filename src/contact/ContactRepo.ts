import {
  add,
  all,
  collection,
  Collection,
  Doc,
  remove,
  value
} from "typesaurus";
import { NotificationService } from "../notifications/NotificationService";
import { ContactDTO, ContactModel, ContactSaveDTO } from "./ContactData";

export class ContactRepo {
  private collection: Collection<ContactModel>;
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.collection = collection("contact");
    this.notificationService = notificationService;
  }

  getMessages = async (): Promise<ContactDTO[]> => {
    const docs = await all(this.collection);
    const messages = docs.map(this.docToDto);
    return messages;
  };

  addMessage = async (data: ContactSaveDTO): Promise<ContactDTO> => {
    const newMessage: ContactModel = {
      ...data,
      createdAt: value("serverDate")
    };
    const res = await add(this.collection, newMessage);
    this.notificationService.newContactMsg();

    return this.docToDto(res);
  };

  deleteMessage = async (id: string): Promise<void> => {
    await remove(this.collection, id);
  };

  private docToDto = (doc: Doc<ContactModel>): ContactDTO => {
    return {
      ...doc.data,
      id: doc.ref.id
    };
  };
}
