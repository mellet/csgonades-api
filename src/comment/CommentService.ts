import { Logger } from "../logger/Logger";
import { NadeRepo } from "../nade/repository/NadeRepo";
import { NotificationRepo } from "../notifications/repository/NotificationRepo";
import { UserRepo } from "../user/repository/UserRepo";
import { AppContext } from "../utils/AppContext";
import { isEntityOwnerOrPrivilegedUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import { CommentCreateDto } from "./dto/CommentCreateDto";
import { CommentDto } from "./dto/CommentDto";
import { CommentUpddateDto } from "./dto/CommentUpddateDto";
import { CommentRepo } from "./repository/CommentRepo";

export type CommentServiceDeps = {
  commentRepo: CommentRepo;
  userRepo: UserRepo;
  nadeRepo: NadeRepo;
  notificationRepo: NotificationRepo;
};

export class CommentService {
  private commentRepo: CommentRepo;
  private userRepo: UserRepo;
  private notificationRepo: NotificationRepo;
  private nadeRepo: NadeRepo;

  constructor(deps: CommentServiceDeps) {
    this.commentRepo = deps.commentRepo;
    this.notificationRepo = deps.notificationRepo;
    this.userRepo = deps.userRepo;
    this.nadeRepo = deps.nadeRepo;
  }

  getForNade = async (nadeId: string): Promise<CommentDto[]> => {
    const comments = await this.commentRepo.getForNade(nadeId);
    return comments;
  };

  getRecent = async (): Promise<CommentDto[]> => {
    const comments = await this.commentRepo.getRecent();
    return comments;
  };

  save = async (
    context: AppContext,
    commentBody: CommentCreateDto
  ): Promise<CommentDto> => {
    const { authUser } = context;

    if (!authUser) {
      Logger.warning("CommentService.save - Not authenticated");
      throw ErrorFactory.Forbidden("Not authenticated");
    }

    const user = await this.userRepo.byId(authUser.steamId);

    if (!user) {
      Logger.error("CommentService.save - No user found to create comment");
      throw ErrorFactory.BadRequest("No user found to create comment");
    }

    const nade = await this.nadeRepo.getById(commentBody.nadeId);

    if (!nade) {
      Logger.error("CommentService.save - No nade found to create comment");
      throw ErrorFactory.BadRequest("No nade found to create comment");
    }

    const comment = await this.commentRepo.createComment(user, commentBody);

    // Don't send notfication when commenting own nade
    if (authUser.steamId !== nade.steamId) {
      this.notificationRepo.newCommentNotification(comment, nade);
    }

    this.nadeRepo.incrementCommentCount(nade.id);

    return comment;
  };

  update = async (context: AppContext, updateModel: CommentUpddateDto) => {
    const originalComment = await this.commentRepo.getById(updateModel.id);

    if (!originalComment) {
      Logger.warning("CommentService.update - NotFound");
      throw ErrorFactory.NotFound("Comment not found");
    }

    if (
      !isEntityOwnerOrPrivilegedUser(originalComment.steamId, context.authUser)
    ) {
      Logger.warning("CommentService.update - Forbidden");
      throw ErrorFactory.Forbidden("You can only edit your own comments");
    }

    const updatedComment = await this.commentRepo.updateComment(updateModel);

    return updatedComment;
  };

  delete = async (context: AppContext, commentId: string) => {
    const { authUser } = context;

    const originalComment = await this.commentRepo.getById(commentId);

    if (!originalComment) {
      Logger.warning("CommentService.delete - NotFound");
      throw ErrorFactory.NotFound("Comment not found");
    }

    if (!isEntityOwnerOrPrivilegedUser(originalComment.steamId, authUser)) {
      Logger.warning("CommentService.delete - Forbidden");
      throw ErrorFactory.Forbidden("You can only delete your own comments");
    }

    await this.commentRepo.deleteComment(commentId);
    await this.nadeRepo.decrementCommentCount(originalComment.nadeId);
  };

  deleteForNadeId = async (nadeId: string) => {
    await this.commentRepo.deleteForNadeId(nadeId);
  };
}
