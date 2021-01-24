import {
  add,
  batch,
  collection,
  Collection,
  get,
  query,
  remove,
  update,
  value,
  where,
} from "typesaurus";
import { UserDto, UserMiniDto } from "../../user/UserDTOs";
import { ErrorFactory } from "../../utils/ErrorUtil";
import { CommentCreateDto } from "../dto/CommentCreateDto";
import { CommentDto } from "../dto/CommentDto";
import { CommentUpddateDto } from "../dto/CommentUpddateDto";
import { CommentModel } from "../model/CommentDoc";
import { CommentRepo } from "./CommentRepo";

export class CommentFireRepo implements CommentRepo {
  private collection: Collection<CommentModel>;

  constructor() {
    this.collection = collection<CommentModel>("nadecomments");
  }

  getForNade = async (nadeId: string): Promise<CommentDto[]> => {
    const nadeCommentDocs = await query(this.collection, [
      where("nadeId", "==", nadeId),
    ]);

    const nadeComments: CommentDto[] = nadeCommentDocs.map((doc) => ({
      id: doc.ref.id,
      ...doc.data,
    }));
    return nadeComments;
  };

  getById = async (commentId: string): Promise<CommentDto> => {
    const commentDoc = await get(this.collection, commentId);

    if (!commentDoc) {
      throw ErrorFactory.NotFound("Comment not found");
    }

    return {
      ...commentDoc.data,
      id: commentDoc.ref.id,
    };
  };

  save = async (
    user: UserMiniDto,
    articleModel: CommentCreateDto
  ): Promise<CommentDto> => {
    const newComment: CommentModel = {
      ...articleModel,
      steamId: user.steamId,
      avatar: user.avatar,
      nickname: user.nickname,
      createdAt: value("serverDate"),
      updatedAt: value("serverDate"),
    };

    const res = await add(this.collection, newComment);

    return {
      ...res.data,
      id: res.ref.id,
    };
  };

  update = async (updateModel: CommentUpddateDto): Promise<CommentDto> => {
    await update(this.collection, updateModel.id, {
      message: updateModel.message,
    });

    return this.getById(updateModel.id);
  };

  delete = async (commentId: string) => {
    await remove(this.collection, commentId);
  };

  deleteForNadeId = async (nadeId: string) => {
    const commentsForNade = await query(this.collection, [
      where("nadeId", "==", nadeId),
    ]);

    const { remove, commit } = batch();

    commentsForNade.forEach((comment) => {
      remove(this.collection, comment.ref.id);
    });

    await commit();
  };

  updateUserDetailsForComments = async (user: UserDto) => {
    const commentsByUser = await query(this.collection, [
      where("steamId", "==", user.steamId),
    ]);

    const { update, commit } = batch();

    commentsByUser.forEach((comment) => {
      update(this.collection, comment.ref.id, {
        nickname: user.nickname,
        avatar: user.avatar,
      });
    });

    await commit();
  };
}
