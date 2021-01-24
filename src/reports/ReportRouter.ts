import * as Sentry from "@sentry/node";
import { RequestHandler, Router } from "express";
import { adminOrModHandler } from "../utils/AuthUtils";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { ReportService } from "./ReportService";
import { validateReportId, validateReportSaveDTO } from "./ReportValidators";

export class ReportRouter {
  private router: Router;
  private reportService: ReportService;

  constructor(reportService: ReportService) {
    this.reportService = reportService;
    this.router = Router();
    this.setUpRoutes();
  }

  getRouter = (): Router => {
    return this.router;
  };

  private setUpRoutes = () => {
    this.router.get("/reports", adminOrModHandler, this.getReports);
    this.router.post("/reports", this.saveReport);
    this.router.delete(
      "/reports/:reportId",
      adminOrModHandler,
      this.deleteReport
    );
  };

  private getReports: RequestHandler = async (_, res) => {
    try {
      const reports = await this.reportService.getAll();

      return res.status(200).send(reports);
    } catch (error) {
      const err = errorCatchConverter(error);

      return res.status(err.code).send(err);
    }
  };

  private saveReport: RequestHandler = async (req, res) => {
    try {
      const dto = validateReportSaveDTO(req);
      const result = await this.reportService.save(dto);

      return res.status(202).send(result);
    } catch (error) {
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private deleteReport: RequestHandler = async (req, res) => {
    try {
      const id = validateReportId(req);
      await this.reportService.delete(id);
      return res.status(204).send();
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };
}
