import { RequestHandler, Router } from "express";
import { authOnlyHandler } from "../utils/AuthUtils";
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
      "/notifications/:id/viewed",
      authOnlyHandler,
      this.viewedNotifcation
    );
  };

  private getNotifications: RequestHandler = async (req, res) => {
    try {
      const user = userFromRequest(req);

      const notifications = await this.notificationService.forUser(
        user.steamId
      );

      return res.status(200).send(notifications);
    } catch (error) {
      const err = errorCatchConverter(error);

      return res.status(err.code).send(err);
    }
  };

  private viewedNotifcation: RequestHandler = async (req, res) => {
    try {
      const user = userFromRequest(req);
      const id = req.params.id;

      await this.notificationService.markAsRead(id, user);

      return res.status(202).send();
    } catch (error) {
      const err = errorCatchConverter(error);

      return res.status(err.code).send(err);
    }
  };
}
