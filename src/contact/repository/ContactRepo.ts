import { ContactDto } from "../dto/ContactDto";
import { ContactSaveDto } from "../dto/ContactSaveDto";

export interface ContactRepo {
  getMessages(): Promise<ContactDto[]>;
  saveMessage(data: ContactSaveDto): Promise<ContactDto>;
  deleteMessage(id: string): Promise<void>;
}
