import { NotificationRepo } from "../notifications/NotificationRepo";
import { ContactDTO, ContactSaveDTO } from "./ContactData";
import { ContactRepo } from "./ContactRepo";

type ContactServiceDeps = {
  contactRepo: ContactRepo;
  notificationRepo: NotificationRepo;
};

export class ContactService {
  private notificationRepo: NotificationRepo;
  private contactRepo: ContactRepo;

  constructor(deps: ContactServiceDeps) {
    this.notificationRepo = deps.notificationRepo;
    this.contactRepo = deps.contactRepo;
  }

  getMessages = (): Promise<ContactDTO[]> => {
    return this.contactRepo.getMessages();
  };

  addMessage = (data: ContactSaveDTO): Promise<ContactDTO> => {
    this.notificationRepo.newContactMessage();
    return this.contactRepo.addMessage(data);
  };

  deleteMessage = (id: string): Promise<void> => {
    return this.contactRepo.deleteMessage(id);
  };
}
