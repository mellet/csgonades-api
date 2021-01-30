import * as Sentry from "@sentry/node";
import { Router } from "express";
import { Logger } from "../logger/Logger";
import { adminOnlyHandler } from "../utils/AuthHandlers";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { sanitizeIt } from "../utils/Sanitize";
import { ContactService } from "./ContactService";
import { ContactDto } from "./dto/ContactDto";

export class ContactRouter {
  private router: Router;
  private contactService: ContactService;

  constructor(contactService: ContactService) {
    this.router = Router();
    this.contactService = contactService;
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
      const contactMessages = await this.contactService.getMessages();

      return res.status(200).send(contactMessages);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private addContactMessage = async (req, res) => {
    try {
      const contactData = sanitizeIt(req.body) as ContactDto;

      await this.contactService.saveMessage(contactData);

      return res.status(201).send();
    } catch (error) {
      Logger.error(error);
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private removeContactMessage = async (req, res) => {
    try {
      const id = req.params.id;
      await this.contactService.deleteMessage(id);

      return res.status(204).send();
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };
}
