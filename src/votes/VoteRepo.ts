import {
  add,
  collection,
  Collection,
  Doc,
  get,
  query,
  remove,
  update,
  value,
  where,
} from "typesaurus";
import { VoteDto, VoteModel, VoteReqBody } from "./Vote";

export class VoteRepo {
  private collection: Collection<VoteModel>;

  constructor() {
    this.collection = collection("votes");
  }

  byId = async (voteId: string) => {
    const doc = await get(this.collection, voteId);

    if (!doc) {
      return null;
    }

    return this.docToDto(doc);
  };

  findVote = async (steamId: string, nadeId: string) => {
    const oldVoteCheck = await query(this.collection, [
      where("nadeId", "==", nadeId),
      where("bySteamId", "==", steamId),
    ]);

    if (!oldVoteCheck.length) {
      return null;
    }

    return this.docToDto(oldVoteCheck[0]);
  };

  getUserVotes = async (steamId: string) => {
    const votes = await query(this.collection, [
      where("bySteamId", "==", steamId),
    ]);

    return votes.map(this.docToDto);
  };

  updateVote = async (voteId: string, voteDirection: number) => {
    await update(this.collection, voteId, {
      vote: voteDirection,
      updatedAt: value("serverDate"),
    });
    return this.byId(voteId);
  };

  createVote = async (steamId: string, voteBody: VoteReqBody) => {
    const result = await add(this.collection, {
      ...voteBody,
      bySteamId: steamId,
      createdAt: value("serverDate"),
    });

    return this.docToDto(result);
  };

  deleteVote = async (voteId: string) => {
    await remove(this.collection, voteId);
  };

  private docToDto = (doc: Doc<VoteModel>): VoteDto => {
    return {
      ...doc.data,
      id: doc.ref.id,
    };
  };
}
