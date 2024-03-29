import { AuditFireRepo } from "./audit/repository/AuditFireRepo";
import { AuditRepo } from "./audit/repository/AuditRepo";
import { IAppCaches } from "./cache/initCache";
import { CommentFireRepo } from "./comment/repository/CommentFireRepo";
import { CommentRepo } from "./comment/repository/CommentRepo";
import { ContactFireRepo } from "./contact/repository/ContactFireRepo";
import { ContactRepo } from "./contact/repository/ContactRepo";
import { FavoriteFireRepo } from "./favorite/repository/FavoriteFireRepo";
import { FavoriteRepo } from "./favorite/repository/FavoriteRepo";
import { ImageStorageRepo } from "./imageGallery/ImageStorageRepo";
import { FirebaseMapEndLocationRepo } from "./maplocation/repository/FirebaseMapEndLocationRepo";
import { FirebaseMapStartLocationRepo } from "./maplocation/repository/FirebaseMapStartLocationRepo";
import { MapEndLocationRepo } from "./maplocation/types/MapEndLocationRepo";
import { MapStartLocationRepo } from "./maplocation/types/MapStartLocationRepo";
import { NadeFireRepo } from "./nade/repository/NadeFireRepo";
import { NadeRepo } from "./nade/repository/NadeRepo";
import { NotificationFireRepo } from "./notifications/repository/NotificationFireRepo";
import { NotificationRepo } from "./notifications/repository/NotificationRepo";
import { PersistedStorage } from "./persistInit";
import { ReportFireRepo } from "./reports/reposityory/ReportFireRepo";
import { StatsFireRepo } from "./stats/repository/StatsFireRepo";
import { StatsRepo } from "./stats/repository/StatsRepo";
import { UserFireRepo } from "./user/repository/UserFireRepo";
import { UserRepo } from "./user/repository/UserRepo";

export interface AppRepositories {
  notificationRepo: NotificationRepo;
  userRepo: UserRepo;
  nadeRepo: NadeRepo;
  favoriteRepo: FavoriteRepo;
  statsRepo: StatsRepo;
  contactRepo: ContactRepo;
  reportRepo: ReportFireRepo;
  imageStorageRepo: ImageStorageRepo;
  commentRepo: CommentRepo;
  auditRepo: AuditRepo;
  mapStartLocationRepo: MapStartLocationRepo;
  mapEndLocationRepo: MapEndLocationRepo;
}

export function repoInit(
  persist: PersistedStorage,
  caches: IAppCaches
): AppRepositories {
  const notificationRepo = new NotificationFireRepo(caches.longtermCache);
  const userRepo = new UserFireRepo(persist.db, caches.longtermCache);
  const nadeRepo = new NadeFireRepo(caches);
  const favoriteRepo = new FavoriteFireRepo(caches.longtermCache);
  const statsRepo = new StatsFireRepo();
  const contactRepo = new ContactFireRepo();
  const reportRepo = new ReportFireRepo();
  const imageStorageRepo = new ImageStorageRepo(persist.bucket);
  const commentRepo = new CommentFireRepo();
  const auditRepo = new AuditFireRepo();
  const mapStartLocationRepo = new FirebaseMapStartLocationRepo();
  const mapEndLocationRepo = new FirebaseMapEndLocationRepo();

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
    mapStartLocationRepo,
    mapEndLocationRepo,
  };
}
