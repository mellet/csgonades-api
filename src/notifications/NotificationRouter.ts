import { RequestHandler, Router } from "express";
import { Logger } from "../logger/Logger";
import { createAppContext } from "../utils/AppContext";
import { authOnlyHandler } from "../utils/AuthHandlers";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { userFromRequest } from "../utils/RouterUtils";
import { NotificationService } from "./NotificationService";

export class NotificationRouter {
  private router: Router;
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
    this.router = Router();
    this.setUpRoutes();
  }

  getRouter = (): Router => {
    return this.router;
  };

  private setUpRoutes = () => {
    this.router.get("/notifications", authOnlyHandler, this.getNotifications);
    this.router.patch(
      "/notifications/viewed",
      authOnlyHandler,
      this.markAllAsViewed
    );
    this.router.patch(
      "/notifications/:id/viewed",
      authOnlyHandler,
      this.viewedNotifcation
    );
  };

  private markAllAsViewed: RequestHandler = async (req, res) => {
    try {
      const context = createAppContext(req);

      await this.notificationService.markAllAsRead(context);

      Logger.verbose(
        "NotificationRouter.markAllAsViewed",
        context.authUser?.steamId
      );

      return res.status(202).send();
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);

      return res.status(err.code).send(err);
    }
  };

  private getNotifications: RequestHandler = async (req, res) => {
    try {
      const user = userFromRequest(req);

      const notifications = await this.notificationService.forUser(
        user.steamId
      );

      Logger.verbose(
        "NotificationRouter.getNotifications",
        notifications.length
      );

      return res.status(200).send(notifications);
    } catch (error) {
      Logger.error(error);
      const err = errorCatchConverter(error);

      return res.status(err.code).send(err);
    }
  };

  private viewedNotifcation: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const context = createAppContext(req);

      await this.notificationService.markAsRead(context, id);

      Logger.verbose("NotificationRouter.viewedNotifcation", id);

      return res.status(202).send();
    } catch (error) {
      Logger.error(error);

      const err = errorCatchConverter(error);

      return res.status(err.code).send(err);
    }
  };
}
