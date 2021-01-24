import * as Sentry from "@sentry/node";
import { RequestHandler, Router } from "express";
import { createAppContext } from "../utils/AppContext";
import { authOnlyHandler } from "../utils/AuthUtils";
import { errorCatchConverter } from "../utils/ErrorUtil";
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
    try {
      const nadeId = sanitizeIt(req.params.nadeId);
      const nadeComments = await this.commentService.getForNade(nadeId);

      return res.status(200).send(nadeComments);
    } catch (error) {
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private createComment: ReqHandlerCreate = async (req, res) => {
    try {
      const context = createAppContext(req);

      const nadeCommentCreateDto: CommentCreateDto = {
        nadeId: sanitizeIt(req.body.nadeId),
        message: sanitizeIt(req.body.message),
      };

      if (!nadeCommentCreateDto.message || !nadeCommentCreateDto.nadeId) {
        throw new Error("Invalid input");
      }

      const comment = await this.commentService.save(
        context,
        nadeCommentCreateDto
      );

      return res.status(201).send(comment);
    } catch (error) {
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private updateComment: ReqHandlerUpdate = async (req, res) => {
    try {
      const context = createAppContext(req);

      const nadeCommentUpdateDto: CommentUpddateDto = {
        id: sanitizeIt(req.params.commentId),
        message: sanitizeIt(req.body.message),
      };

      if (!nadeCommentUpdateDto.message || !nadeCommentUpdateDto.id) {
        throw new Error("Invalid input");
      }

      const updatedComment = await this.commentService.update(
        context,
        nadeCommentUpdateDto
      );
      return res.status(201).send(updatedComment);
    } catch (error) {
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private deleteComment: ReqHandlerWithCommentId = async (req, res) => {
    try {
      const context = createAppContext(req);
      const commentId = sanitizeIt(req.params.commentId);
      await this.commentService.delete(context, commentId);

      return res.status(204).send();
    } catch (error) {
      Sentry.captureException(error);
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };
}
