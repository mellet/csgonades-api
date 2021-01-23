import { NadeRepo } from "../nade/NadeRepo";
import { NotificationRepo } from "../notifications/NotificationRepo";
import { UserRepo } from "../user/UserRepo";
import { isEntityOwnerOrPrivilegedUser, RequestUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import {
  NadeCommentCreateDTO,
  NadeCommentDto,
  NadeCommentUpdateDTO,
} from "./NadeComment";
import { NadeCommentRepo } from "./NadeCommentRepo";

type NadeCommentServiceDeps = {
  commentRepo: NadeCommentRepo;
  userRepo: UserRepo;
  nadeRepo: NadeRepo;
  notificationRepo: NotificationRepo;
};

export class NadeCommentService {
  private commentRepo: NadeCommentRepo;
  private userRepo: UserRepo;
  private notificationRepo: NotificationRepo;
  private nadeRepo: NadeRepo;

  constructor(deps: NadeCommentServiceDeps) {
    this.commentRepo = deps.commentRepo;
    this.notificationRepo = deps.notificationRepo;
    this.userRepo = deps.userRepo;
    this.nadeRepo = deps.nadeRepo;
  }

  getForNade = async (nadeId: string): Promise<NadeCommentDto[]> => {
    return this.commentRepo.getForNade(nadeId);
  };

  save = async (
    commentBody: NadeCommentCreateDTO,
    bySteamId: string
  ): Promise<NadeCommentDto> => {
    const user = await this.userRepo.byId(bySteamId);
    const nade = await this.nadeRepo.getById(commentBody.nadeId);

    const comment = await this.commentRepo.save({
      nadeId: commentBody.nadeId,
      message: commentBody.message,
      nickname: user.nickname,
      steamId: user.steamId,
      avatar: user.avatar,
      createdAt: new Date(),
      updatedAt: null,
    });

    // Don't send notfication when commenting own nade
    if (bySteamId !== nade.steamId) {
      this.notificationRepo.newCommentNotification(comment, nade);
    }

    this.nadeRepo.incrementCommentCount(nade.id);

    return comment;
  };

  update = async (updateModel: NadeCommentUpdateDTO, user: RequestUser) => {
    const originalComment = await this.commentRepo.getById(updateModel.id);

    if (!isEntityOwnerOrPrivilegedUser(originalComment.steamId, user)) {
      throw ErrorFactory.Forbidden("You can only edit your own comments");
    }

    return this.commentRepo.update(updateModel);
  };

  delete = async (commentId: string, user: RequestUser) => {
    const originalComment = await this.commentRepo.getById(commentId);

    if (!isEntityOwnerOrPrivilegedUser(originalComment.steamId, user)) {
      throw ErrorFactory.Forbidden("You can only delete your own comments");
    }

    await this.commentRepo.delete(commentId);
    await this.nadeRepo.decrementCommentCount(originalComment.nadeId);
  };

  deleteForNadeId = async (nadeId: string) => {
    await this.commentRepo.deleteForNadeId(nadeId);
  };
}
