import { EventBus } from "../services/EventHandler";
import { RequestUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import { VoteReqBody } from "./Vote";
import { VoteRepo } from "./VoteRepo";

type VoteServiceDeps = {
  voteRepo: VoteRepo;
  eventBus: EventBus;
};

export class VoteService {
  private voteRepo: VoteRepo;
  private eventBus: EventBus;

  constructor(deps: VoteServiceDeps) {
    const { eventBus } = deps;
    this.voteRepo = deps.voteRepo;
    this.eventBus = eventBus;
  }

  getUserVotes = async (user: RequestUser) => {
    return this.voteRepo.getUserVotes(user.steamId);
  };

  castVote = async (user: RequestUser, voteBody: VoteReqBody) => {
    const previousVote = await this.voteRepo.findVote(
      user.steamId,
      voteBody.nadeId
    );

    const isUpVote = voteBody.vote > 0;

    // If no previous vote, create the vote
    if (!previousVote) {
      console.log("> Creating new vote");
      const vote = await this.voteRepo.createVote(user.steamId, voteBody);
      // Increment or decrement by vote value
      if (isUpVote) {
        this.eventBus.emitIncrementUpVote(voteBody.nadeId);
      } else {
        this.eventBus.emitIncrementDownVote(voteBody.nadeId);
      }
      return vote;
    }

    // Ignore if vote is equal to current vote
    if (previousVote.vote === voteBody.vote) {
      console.log("Ignoring vote");
      return null;
    }

    // Update vote direction
    const vote = await this.voteRepo.updateVote(previousVote.id, voteBody.vote);

    // Vote change
    if (isUpVote) {
      console.log("> Change to up vote");
      this.eventBus.emitDecrementDownVote(voteBody.nadeId);
      this.eventBus.emitIncrementUpVote(voteBody.nadeId);
    } else {
      console.log("> Changed to down vote");
      this.eventBus.emitDecrementUpVote(voteBody.nadeId);
      this.eventBus.emitIncrementDownVote(voteBody.nadeId);
    }
    return vote;
  };

  removeVote = async (user: RequestUser, voteId: string) => {
    const previousVote = await this.voteRepo.byId(voteId);

    if (!previousVote) {
      console.warn("Did not find vote to remove");
      return;
    }

    if (user.steamId !== previousVote.bySteamId) {
      throw ErrorFactory.Forbidden("Vote not owned by user");
    }

    const isUpVote = previousVote.vote > 0;

    if (isUpVote) {
      this.eventBus.emitDecrementUpVote(previousVote.nadeId);
    } else {
      this.eventBus.emitDecrementDownVote(previousVote.nadeId);
    }
  };
}
