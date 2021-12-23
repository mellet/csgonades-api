import { RequestHandler, Router } from "express";
import { createAppContext } from "../utils/AppContext";
import { authOnlyHandler } from "../utils/AuthHandlers";
import { ErrorFactory } from "../utils/ErrorUtil";
import { sanitizeIt } from "../utils/Sanitize";
import { CommentService } from "./CommentService";
import { CommentCreateDto } from "./dto/CommentCreateDto";
import { CommentUpddateDto } from "./dto/CommentUpddateDto";

type CommentRouterDeps = {
  commentService: CommentService;
};

type ReqHandlerWithCommentId = RequestHandler<{ commentId: string }>;

type ReqHandlerWithNadeId = RequestHandler<{ nadeId: string }>;

type ReqHandlerCreate = RequestHandler<{}, any, CommentCreateDto>;

type ReqHandlerUpdate = RequestHandler<
  { commentId: string },
  any,
  CommentUpddateDto
>;

export class CommentRouter {
  private router: Router;
  private commentService: CommentService;

  constructor(deps: CommentRouterDeps) {
    this.commentService = deps.commentService;
    this.router = Router();
    this.setUpRoutes();
  }

  getRouter = (): Router => {
    return this.router;
  };

  private setUpRoutes = () => {
    this.router.get("/nades/:nadeId/comments", this.getCommentsForNade);
    this.router.get("/comments/recent", this.getRecentcomments);
    this.router.post(
      "/nades/:nadeId/comments",
      authOnlyHandler,
      this.createComment
    );
    this.router.patch(
      "/nades/:nadeId/comments/:commentId",
      authOnlyHandler,
      this.updateComment
    );
    this.router.delete(
      "/nades/:nadeId/comments/:commentId",
      authOnlyHandler,
      this.deleteComment
    );
  };

  private getCommentsForNade: ReqHandlerWithNadeId = async (req, res) => {
    const nadeId = sanitizeIt(req.params.nadeId);
    const nadeComments = await this.commentService.getForNade(nadeId);

    return res.status(200).send(nadeComments);
  };

  private getRecentcomments: RequestHandler = async (req, res) => {
    const nadeComments = await this.commentService.getRecent();

    return res.status(200).send(nadeComments);
  };

  private createComment: ReqHandlerCreate = async (req, res) => {
    const context = createAppContext(req);

    const commentCreateDto = validateCreateComment(
      req.body.nadeId,
      req.body.message
    );

    const comment = await this.commentService.save(context, commentCreateDto);

    return res.status(201).send(comment);
  };

  private updateComment: ReqHandlerUpdate = async (req, res) => {
    const context = createAppContext(req);

    const commentUpdateDto = validateUpdateComment(
      req.params.commentId,
      req.body.message
    );

    const updatedComment = await this.commentService.update(
      context,
      commentUpdateDto
    );

    return res.status(201).send(updatedComment);
  };

  private deleteComment: ReqHandlerWithCommentId = async (req, res) => {
    const context = createAppContext(req);
    const commentId = sanitizeIt(req.params.commentId);
    await this.commentService.delete(context, commentId);

    return res.status(204).send();
  };
}

function validateUpdateComment(commentId: string, message: string) {
  const nadeCommentUpdateDto: CommentUpddateDto = {
    id: sanitizeIt(commentId),
    message: sanitizeIt(message),
  };

  if (!nadeCommentUpdateDto.message || !nadeCommentUpdateDto.id) {
    throw ErrorFactory.BadRequest("Invalid input");
  }

  return nadeCommentUpdateDto;
}

function validateCreateComment(
  nadeId?: string,
  message?: string
): CommentCreateDto {
  if (!message || !nadeId) {
    throw ErrorFactory.BadRequest("Invalid input");
  }

  const nadeCommentCreateDto: CommentCreateDto = {
    nadeId: sanitizeIt(nadeId),
    message: sanitizeIt(message),
  };

  return nadeCommentCreateDto;
}
