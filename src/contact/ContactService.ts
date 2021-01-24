import { NotificationRepo } from "../notifications/repository/NotificationRepo";
import { ContactDto } from "./dto/ContactDto";
import { ContactSaveDto } from "./dto/ContactSaveDto";
import { ContactRepo } from "./repository/ContactRepo";

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

  getMessages = (): Promise<ContactDto[]> => {
    return this.contactRepo.getMessages();
  };

  saveMessage = (data: ContactSaveDto): Promise<ContactDto> => {
    this.notificationRepo.newContactMessage();
    return this.contactRepo.saveMessage(data);
  };

  deleteMessage = (id: string): Promise<void> => {
    return this.contactRepo.deleteMessage(id);
  };
}
