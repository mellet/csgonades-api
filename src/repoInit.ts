import { AuditRepo } from "./audit/AuditRepo";
import { CommentFireRepo } from "./comment/repository/CommentFireRepo";
import { CommentRepo } from "./comment/repository/CommentRepo";
import { ContactRepo } from "./contact/ContactRepo";
import { FavoriteRepo } from "./favorite/FavoriteRepo";
import { ImageStorageRepo } from "./imageGallery/ImageStorageRepo";
import { NadeFireRepo } from "./nade/repository/NadeFireRepo";
import { NadeRepo } from "./nade/repository/NadeRepo";
import { NotificationRepo } from "./notifications/NotificationRepo";
import { PersistedStorage } from "./persistInit";
import { ReportRepo } from "./reports/ReportRepo";
import { StatsRepo } from "./stats/StatsRepo";
import { UserRepo } from "./user/UserRepo";

export interface AppRepositories {
  notificationRepo: NotificationRepo;
  userRepo: UserRepo;
  nadeRepo: NadeRepo;
  favoriteRepo: FavoriteRepo;
  statsRepo: StatsRepo;
  contactRepo: ContactRepo;
  reportRepo: ReportRepo;
  imageStorageRepo: ImageStorageRepo;
  commentRepo: CommentRepo;
  auditRepo: AuditRepo;
}

export function repoInit(persist: PersistedStorage): AppRepositories {
  const notificationRepo = new NotificationRepo();
  const userRepo = new UserRepo(persist.db);
  const nadeRepo = new NadeFireRepo();
  const favoriteRepo = new FavoriteRepo();
  const statsRepo = new StatsRepo();
  const contactRepo = new ContactRepo();
  const reportRepo = new ReportRepo();
  const imageStorageRepo = new ImageStorageRepo(persist.bucket);
  const commentRepo = new CommentFireRepo();
  const auditRepo = new AuditRepo();

  return {
    notificationRepo,
    userRepo,
    nadeRepo,
    favoriteRepo,
    statsRepo,
    contactRepo,
    reportRepo,
    imageStorageRepo,
    commentRepo,
    auditRepo,
  };
}
