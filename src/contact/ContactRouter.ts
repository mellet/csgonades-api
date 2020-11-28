import * as Sentry from "@sentry/node";
import { Router } from "express";
import { adminOnlyHandler } from "../utils/AuthUtils";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { sanitizeIt } from "../utils/Sanitize";
import { ContactDTO } from "./ContactData";
import { ContactService } from "./ContactService";

export class ContactRouter {
  private router: Router;
  private contactRepo: ContactService;

  constructor(contactRepo: ContactService) {
    this.router = Router();
    this.contactRepo = contactRepo;
    this.setupRoutes();
  }

  getRouter = () => {
    return this.router;
  };

  private setupRoutes = () => {
    this.router.get("/contact", adminOnlyHandler, this.getContactMessages);
    this.router.post("/contact", this.addContactMessage);
    this.router.delete(
      "/contact/:id",
      adminOnlyHandler,
      this.removeContactMessage
    );
  };

  private getContactMessages = async (_, res) => {
    try {
      const contactMessages = await this.contactRepo.getMessages();

      return res.status(200).send(contactMessages);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private addContactMessage = async (req, res) => {
    try {
      const contactData = sanitizeIt(req.body) as ContactDTO;

      await this.contactRepo.addMessage(contactData);

      return res.status(201).send();
    } catch (error) {
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private removeContactMessage = async (req, res) => {
    try {
      const id = req.params.id;
      await this.contactRepo.deleteMessage(id);

      return res.status(204).send();
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };
}
