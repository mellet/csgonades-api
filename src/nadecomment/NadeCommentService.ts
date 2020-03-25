import { EventBus } from "../services/EventHandler";
import { UserDTO } from "../user/UserDTOs";
import { UserService } from "../user/UserService";
import { RequestUser } from "../utils/AuthUtils";
import { ErrorFactory } from "../utils/ErrorUtil";
import {
  NadeCommentCreateDTO,
  NadeCommentDto,
  NadeCommentUpdateDTO
} from "./NadeComment";
import { NadeCommentRepo } from "./NadeCommentRepo";

type NadeCommentServiceDeps = {
  nadeCommentRepo: NadeCommentRepo;
  userService: UserService;
  eventBus: EventBus;
};

export class NadeCommentService {
  private nadeCommentRepo: NadeCommentRepo;
  private userService: UserService;
  private eventBus: EventBus;

  constructor(deps: NadeCommentServiceDeps) {
    this.nadeCommentRepo = deps.nadeCommentRepo;
    this.userService = deps.userService;
    this.eventBus = deps.eventBus;

    this.eventBus.subUserDetailsUpdate(this.updateUserDetailsOnComments);
  }

  private updateUserDetailsOnComments = async (user: UserDTO) => {
    this.nadeCommentRepo.updateUserDetailsForComments(user);
  };

  getForNade = async (nadeId: string): Promise<NadeCommentDto[]> => {
    return this.nadeCommentRepo.getForNade(nadeId);
  };

  save = async (
    nadeBody: NadeCommentCreateDTO,
    bySteamId: string
  ): Promise<NadeCommentDto> => {
    const user = await this.userService.byId(bySteamId);

    const res = await this.nadeCommentRepo.save({
      nadeId: nadeBody.nadeId,
      message: nadeBody.message,
      nickname: user.nickname,
      steamId: user.steamId,
      avatar: user.avatar,
      createdAt: new Date(),
      updatedAt: null
    });

    this.eventBus.emitNadeCommentCreate(res);

    return res;
  };

  update = async (updateModel: NadeCommentUpdateDTO, user: RequestUser) => {
    console.log("> update", {
      updateModel,
      user
    });
    const originalComment = await this.nadeCommentRepo.getById(updateModel.id);

    if (user.steamId !== originalComment.steamId && user.role === "user") {
      throw ErrorFactory.Forbidden("You can only edit your own comments");
    }

    return this.nadeCommentRepo.update(updateModel);
  };

  delete = async (commentId: string, user: RequestUser) => {
    const originalComment = await this.nadeCommentRepo.getById(commentId);

    if (user.role === "user" && user.steamId !== originalComment.steamId) {
      throw ErrorFactory.Forbidden("You can only delete your own comments");
    }

    await this.nadeCommentRepo.delete(commentId);

    this.eventBus.emitNadeCommentDelete(originalComment);
  };
}
