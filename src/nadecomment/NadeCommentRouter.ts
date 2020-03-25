import { RequestHandler, Router } from "express";
import { authOnlyHandler } from "../utils/AuthUtils";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { userFromRequest } from "../utils/RouterUtils";
import { sanitizeIt } from "../utils/Sanitize";
import { NadeCommentCreateDTO, NadeCommentUpdateDTO } from "./NadeComment";
import { NadeCommentService } from "./NadeCommentService";

type NadeCommentRouterDeps = {
  nadeCommentService: NadeCommentService;
};

export class NadeCommentRouter {
  private router: Router;
  private nadeCommentService: NadeCommentService;

  constructor(deps: NadeCommentRouterDeps) {
    this.nadeCommentService = deps.nadeCommentService;
    this.router = Router();
    this.setUpRoutes();
  }

  getRouter = (): Router => {
    return this.router;
  };

  private setUpRoutes = () => {
    this.router.get("/nades/:nadeId/comments", this.getCommentForNade);
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

  private getCommentForNade: RequestHandler = async (req, res) => {
    try {
      const nadeId = req.params.nadeId;

      const nadeComments = await this.nadeCommentService.getForNade(nadeId);

      return res.status(200).send(nadeComments);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private createComment: RequestHandler = async (req, res) => {
    try {
      const user = userFromRequest(req);
      const dirtyBody = req.body as NadeCommentCreateDTO;
      const nadeCommentBody: NadeCommentCreateDTO = {
        nadeId: sanitizeIt(dirtyBody.nadeId),
        message: sanitizeIt(dirtyBody.message)
      };

      if (!nadeCommentBody.message || !nadeCommentBody.nadeId) {
        throw new Error("Invalid input");
      }

      const comment = await this.nadeCommentService.save(
        nadeCommentBody,
        user.steamId
      );

      return res.status(201).send(comment);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private updateComment: RequestHandler = async (req, res) => {
    console.log("> Update comment");
    try {
      const user = userFromRequest(req);
      const commentId = sanitizeIt(req.params.commentId);
      const dirtyBody = req.body as NadeCommentUpdateDTO;

      const nadeCommentBody: NadeCommentUpdateDTO = {
        id: commentId,
        message: sanitizeIt(dirtyBody.message)
      };

      if (!nadeCommentBody.message || !nadeCommentBody.id) {
        throw new Error("Invalid input");
      }

      const updatedComment = await this.nadeCommentService.update(
        nadeCommentBody,
        user
      );
      return res.status(201).send(updatedComment);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private deleteComment: RequestHandler = async (req, res) => {
    try {
      const user = userFromRequest(req);
      const commentId = sanitizeIt(req.params.commentId);
      await this.nadeCommentService.delete(commentId, user);

      return res.status(204).send();
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };
}
