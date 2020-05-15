import { EventEmitter } from "events";
import { FavoriteDTO } from "../favorite/Favorite";
import { NadeDTO } from "../nade/Nade";
import { NadeCommentDto } from "../nadecomment/NadeComment";
import { ReportDTO } from "../reports/Report";
import { UserDTO } from "../user/UserDTOs";

const FavoriteEventType = "@@favorite/NEW";
const UnfavoriteEventType = "@@facvorte/REMOVE";
const NadeDelete = "@@nade/DELETE";
const NadeNew = "@@nade/NEW";
const NadeAccepted = "@@nade/ACCEPTED";
const NadeDeclined = "@@nade/DECLINED";
const NewUser = "@@user/NEW";
const NewReport = "@@report/NEW";
const OnNadeCommentCreate = "@@nadecomment/NEW";
const OnNadeCommentDelete = "@@nadecomment/DELETE";
const OnUserDetailsUpdate = "@@user/UPDATE";
const OnIncrementUpVote = "@@vote/INC_UPVOTE";
const OnDecrementUpVote = "@@vote/DEC_UPVOTE";
const OnIncrementDownVote = "@@vote/INC_DOWNVOTE";
const OnDecrementDownVote = "@@vote/DEC_DOWNVOTE";

type VoteData = {
  nadeId: string;
};

export class EventBus {
  private eventEmitter: EventEmitter;
  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  emitIncrementUpVote = (nadeId: string) => {
    this.eventEmitter.emit(OnIncrementUpVote, nadeId);
  };

  emitDecrementUpVote = (nadeId: string) => {
    this.eventEmitter.emit(OnDecrementUpVote, nadeId);
  };

  subIncrementUpVote = (cb: (nadeId: string) => void) => {
    this.eventEmitter.on(OnIncrementUpVote, (votedNadeId: string) =>
      cb(votedNadeId)
    );
  };

  subDecrementUpVote = (cb: (nadeId: string) => void) => {
    this.eventEmitter.on(OnDecrementUpVote, (votedNadeId: string) =>
      cb(votedNadeId)
    );
  };

  emitIncrementDownVote = (nadeId: string) => {
    this.eventEmitter.emit(OnIncrementDownVote, nadeId);
  };

  emitDecrementDownVote = (nadeId: string) => {
    this.eventEmitter.emit(OnDecrementDownVote, nadeId);
  };

  subIncrementDownVote = (cb: (nadeId: string) => void) => {
    this.eventEmitter.on(OnIncrementDownVote, (votedNadeId: string) =>
      cb(votedNadeId)
    );
  };

  subDecrementDownVote = (cb: (nadeId: string) => void) => {
    this.eventEmitter.on(OnDecrementDownVote, (votedNadeId: string) =>
      cb(votedNadeId)
    );
  };

  subUserDetailsUpdate = (cb: (user: UserDTO) => void) => {
    this.eventEmitter.on(OnUserDetailsUpdate, (value: UserDTO) => cb(value));
  };

  emitUserDetailsUpdate = (user: UserDTO) => {
    this.eventEmitter.emit(OnUserDetailsUpdate, user);
  };

  subNadeCommentDelete = (cb: (comment: NadeCommentDto) => void) => {
    this.eventEmitter.on(OnNadeCommentDelete, (value: NadeCommentDto) =>
      cb(value)
    );
  };

  emitNadeCommentDelete = (comment: NadeCommentDto) => {
    this.eventEmitter.emit(OnNadeCommentDelete, comment);
  };

  subNadeCommentCreate = (cb: (comment: NadeCommentDto) => void) => {
    this.eventEmitter.on(OnNadeCommentCreate, (value: NadeCommentDto) =>
      cb(value)
    );
  };

  emitNadeCommentCreate = (comment: NadeCommentDto) => {
    this.eventEmitter.emit(OnNadeCommentCreate, comment);
  };

  subNewFavorites = (cb: (fav: FavoriteDTO) => void) => {
    this.eventEmitter.on(FavoriteEventType, (value: FavoriteDTO) => cb(value));
  };

  subUnFavorite = (cb: (fav: FavoriteDTO) => void) => {
    this.eventEmitter.on(UnfavoriteEventType, (value: FavoriteDTO) =>
      cb(value)
    );
  };

  subNadeDelete = (cb: (nade: NadeDTO) => void) => {
    this.eventEmitter.on(NadeDelete, (value: NadeDTO) => cb(value));
  };

  subAcceptedNade = (cb: (nade: NadeDTO) => void) => {
    this.eventEmitter.on(NadeAccepted, (value: NadeDTO) => cb(value));
  };

  subDeclinedNade = (cb: (nade: NadeDTO) => void) => {
    this.eventEmitter.on(NadeDeclined, (value: NadeDTO) => cb(value));
  };

  subNewNade = (cb: (nade: NadeDTO) => void) => {
    this.eventEmitter.on(NadeNew, (value: NadeDTO) => cb(value));
  };

  subNewUser = (cb: (user: UserDTO) => void) => {
    this.eventEmitter.on(NewUser, (value: UserDTO) => cb(value));
  };

  subNewReport = (cb: (report: ReportDTO) => void) => {
    this.eventEmitter.on(NewReport, (value: ReportDTO) => cb(value));
  };

  emitNewUser = (user: UserDTO) => {
    this.eventEmitter.emit(NewUser, user);
  };

  emitNewFavorite = (fav: FavoriteDTO) => {
    this.eventEmitter.emit(FavoriteEventType, fav);
  };

  emitUnFavorite = (fav: FavoriteDTO) => {
    this.eventEmitter.emit(UnfavoriteEventType, fav);
  };

  emitNadeDelete = (nade: NadeDTO) => {
    this.eventEmitter.emit(NadeDelete, nade);
  };

  emitNewNade = (nade: NadeDTO) => {
    this.eventEmitter.emit(NadeNew, nade);
  };

  emitNadeAccepted = (nade: NadeDTO) => {
    this.eventEmitter.emit(NadeAccepted, nade);
  };

  emitNadeDeclined = (nade: NadeDTO) => {
    this.eventEmitter.emit(NadeDeclined, nade);
  };

  emitNewReport = (report: ReportDTO) => {
    this.eventEmitter.emit(NewReport, report);
  };
}
