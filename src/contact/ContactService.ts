import { NotificationService } from "../notifications/NotificationService";
import { ContactDTO, ContactSaveDTO } from "./ContactData";
import { ContactRepo } from "./ContactRepo";

type ContactServiceDeps = {
  contactRepo: ContactRepo;
  notificationService: NotificationService;
};

export class ContactService {
  private notificationService: NotificationService;
  private contactRepo: ContactRepo;

  constructor(deps: ContactServiceDeps) {
    this.notificationService = deps.notificationService;
    this.contactRepo = deps.contactRepo;
  }

  getMessages = (): Promise<ContactDTO[]> => {
    return this.contactRepo.getMessages();
  };

  addMessage = (data: ContactSaveDTO): Promise<ContactDTO> => {
    this.notificationService.newContactMsg();
    return this.contactRepo.addMessage(data);
  };

  deleteMessage = (id: string): Promise<void> => {
    return this.contactRepo.deleteMessage(id);
  };
}
