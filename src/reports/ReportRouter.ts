import { RequestHandler, Router } from "express";
import { Logger } from "../logger/Logger";
import { adminOrModHandler } from "../utils/AuthHandlers";
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
      Logger.verbose("ReportRouter.getReports", reports.length);

      return res.status(200).send(reports);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);

      return res.status(err.code).send(err);
    }
  };

  private saveReport: RequestHandler = async (req, res) => {
    try {
      const dto = validateReportSaveDTO(req);
      const result = await this.reportService.save(dto);
      Logger.verbose("ReportRouter.saveReport");

      if (!result) {
        return res.status(401).send();
      }

      return res.status(202).send(result);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private deleteReport: RequestHandler = async (req, res) => {
    try {
      const id = validateReportId(req);
      await this.reportService.delete(id);
      Logger.verbose("ReportRouter.deleteReport", id);

      return res.status(204).send();
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };
}
