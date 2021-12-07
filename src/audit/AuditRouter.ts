import { RequestHandler, Router } from "express";
import { adminOrModHandler } from "../utils/AuthHandlers";
import { AuditService } from "./AuditService";

export class AuditRouter {
  private router: Router;
  private auditService: AuditService;

  constructor(auditService: AuditService) {
    this.router = Router();
    this.auditService = auditService;
    this.setupRoutes();
  }

  getRouter = () => {
    return this.router;
  };

  private setupRoutes = () => {
    this.router.get("/audits", adminOrModHandler, this.getContactMessages);
  };

  private getContactMessages: RequestHandler = async (_, res) => {
    const auditEvents = await this.auditService.getAuditEvents();
    return res.status(200).send(auditEvents);
  };
}
