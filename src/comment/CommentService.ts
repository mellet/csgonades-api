import { NadeRepo } from "../nade/NadeRepo";
import { NotificationRepo } from "../notifications/NotificationRepo";
import { UserRepo } from "../user/UserRepo";
import { AppContext } from "../utils/AppContext";
import { isEntityOwnerOrPrivilegedUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import { CommentCreateDto, CommentDto, CommentUpddateDto } from "./Comment";
import { CommentRepo } from "./CommentRepo";

type CommentServiceDeps = {
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
    return this.commentRepo.getForNade(nadeId);
  };

  save = async (
    context: AppContext,
    commentBody: CommentCreateDto
  ): Promise<CommentDto> => {
    const { authUser } = context;

    if (!authUser) {
      throw ErrorFactory.Forbidden("Not authenticated");
    }

    const user = await this.userRepo.byId(authUser.steamId);

    if (!user) {
      throw ErrorFactory.BadRequest("No user found to create comment");
    }

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
    if (authUser.steamId !== nade.steamId) {
      this.notificationRepo.newCommentNotification(comment, nade);
    }

    this.nadeRepo.incrementCommentCount(nade.id);

    return comment;
  };

  update = async (context: AppContext, updateModel: CommentUpddateDto) => {
    const originalComment = await this.commentRepo.getById(updateModel.id);

    if (
      !isEntityOwnerOrPrivilegedUser(originalComment.steamId, context.authUser)
    ) {
      throw ErrorFactory.Forbidden("You can only edit your own comments");
    }

    return this.commentRepo.update(updateModel);
  };

  delete = async (context: AppContext, commentId: string) => {
    const { authUser } = context;

    const originalComment = await this.commentRepo.getById(commentId);

    if (!isEntityOwnerOrPrivilegedUser(originalComment.steamId, authUser)) {
      throw ErrorFactory.Forbidden("You can only delete your own comments");
    }

    await this.commentRepo.delete(commentId);
    await this.nadeRepo.decrementCommentCount(originalComment.nadeId);
  };

  deleteForNadeId = async (nadeId: string) => {
    await this.commentRepo.deleteForNadeId(nadeId);
  };
}
