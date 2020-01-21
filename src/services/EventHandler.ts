import { EventEmitter } from "events";
import { FavoriteDTO } from "../favorite/Favorite";
import { NadeDTO } from "../nade/Nade";
import { UserDTO } from "../user/UserDTOs";

const FavoriteEventType = "@@favorite/NEW";
const UnfavoriteEventType = "@@facvorte/REMOVE";
const NadeDelete = "@@nade/DELETE";
const NadeNew = "@@nade/NEW";
const NadeAccepted = "@@nade/ACCEPTED";
const NadeDeclined = "@@nade/DECLINED";
const NewUser = "@@user/NEW";

export class EventBus {
  private eventEmitter: EventEmitter;
  constructor() {
    this.eventEmitter = new EventEmitter();
  }

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
}
