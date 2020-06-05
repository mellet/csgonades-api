import { Router } from "express";
import { Request, Response } from "express-serve-static-core";
import { authOnlyHandler } from "../utils/AuthUtils";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { userFromRequest } from "../utils/RouterUtils";
import { sanitizeIt } from "../utils/Sanitize";
import { VoteReqBody } from "./Vote";
import { VoteService } from "./VoteService";

type VoteRepoDeps = {
  voteService: VoteService;
};

export class VoteRouter {
  private router: Router;
  private voteService: VoteService;

  constructor(services: VoteRepoDeps) {
    this.voteService = services.voteService;
    this.router = Router();
    this.setUpRoutes();
  }

  getRouter = (): Router => {
    return this.router;
  };

  private setUpRoutes = () => {
    this.router.get("/votes", authOnlyHandler, this.getVotes);
    this.router.post("/votes", authOnlyHandler, this.castVote);
    this.router.delete("/votes/:voteId", authOnlyHandler, this.removeVote);
  };

  private getVotes = async (req: Request, res: Response) => {
    try {
      const user = userFromRequest(req);
      const votes = await this.voteService.getUserVotes(user);

      return res.status(200).send(votes);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private castVote = async (req: Request, res: Response) => {
    try {
      const user = userFromRequest(req);
      const voteBody = req.body as VoteReqBody;

      const vote = await this.voteService.castVote(user, voteBody);

      return res.status(201).send(vote);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  private removeVote = async (req: Request, res: Response) => {
    try {
      const voteId = sanitizeIt(req.params.voteId);
      const user = userFromRequest(req);

      await this.voteService.removeVote(user, voteId);

      return res.status(202).send();
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };
}
