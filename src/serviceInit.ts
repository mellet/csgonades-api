import { AuditService } from "./audit/AuditService";
import { CommentService } from "./comment/CommentService";
import { CSGNConfig } from "./config/enironment";
import { ContactService } from "./contact/ContactService";
import { GfycatApi } from "./external-api/GfycatApi";
import { GoogleApi } from "./external-api/GoogleApi";
import { SteamApi } from "./external-api/SteamApi";
import { FavoriteService } from "./favorite/FavoriteService";
import { ImageRepo } from "./imageGallery/ImageGalleryService";
import { NadeService } from "./nade/NadeService";
import { NotificationService } from "./notifications/NotificationService";
import { AppRepositories } from "./repoInit";
import { ReportService } from "./reports/ReportService";
import { UserService } from "./user/UserService";

export function serviceInit(
  config: CSGNConfig,
  repositories: AppRepositories,
  gfycatApi: GfycatApi,
  steamApi: SteamApi,
  googleApi: GoogleApi
) {
  const {
    auditRepo,
    commentRepo,
    contactRepo,
    favoriteRepo,
    imageStorageRepo,
    nadeRepo,
    notificationRepo,
    reportRepo,
    statsRepo,
    userRepo,
  } = repositories;

  const auditService = new AuditService({ auditRepo });

  const imageRepo = new ImageRepo({
    config,
    imageStorageRepo,
  });

  const reporService = new ReportService({
    reportRepo,
    notificationRepo,
    userRepo,
  });

  const userService = new UserService({
    steamApi,
    userRepo,
    nadeRepo,
    statsRepo,
    commentRepo,
  });

  const nadeService = new NadeService({
    gfycatApi,
    imageRepo,
    nadeRepo,
    statsRepo,
    commentRepo,
    notificationRepo,
    favoriteRepo,
    userRepo,
    googleApi,
  });

  const favoriteService = new FavoriteService({
    favoriteRepo,
    nadeRepo,
    notificationRepo,
    userRepo,
  });

  const notificationService = new NotificationService({
    notificationRepo,
  });

  const contactService = new ContactService({
    contactRepo,
    notificationRepo,
  });

  const commentService = new CommentService({
    commentRepo,
    nadeRepo,
    notificationRepo,
    userRepo,
  });

  return {
    auditService,
    reporService,
    userService,
    nadeService,
    favoriteService,
    notificationService,
    contactService,
    commentService,
  };
}
