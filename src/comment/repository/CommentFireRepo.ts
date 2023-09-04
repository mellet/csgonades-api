import {
  add,
  batch,
  collection,
  Collection,
  Doc,
  get,
  limit,
  order,
  query,
  remove,
  update,
  value,
  where,
} from "typesaurus";
import { AddModel } from "typesaurus/add";
import { Logger } from "../../logger/Logger";
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

  public getForNade = async (nadeId: string): Promise<CommentDto[]> => {
    try {
      const nadeCommentDocs = await query(this.collection, [
        where("nadeId", "==", nadeId),
      ]);

      Logger.verbose(
        `CommentRepo.getForNade(${nadeId}) -> ${nadeCommentDocs.length} | DB`
      );

      return nadeCommentDocs.map(this.toDto);
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to get comments for nade");
    }
  };

  getById = async (commentId: string): Promise<CommentDto | null> => {
    try {
      const commentDoc = await get(this.collection, commentId);

      if (!commentDoc) {
        return null;
      }

      Logger.verbose(`CommentRepo.getById(${commentId}) | DB`);

      return this.toDto(commentDoc);
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to get comment by id");
    }
  };

  getRecent = async (): Promise<CommentDto[]> => {
    try {
      const nadeCommentDocs = await query(this.collection, [
        order("createdAt", "desc"),
        where("steamId", "==", "76561198026064832"),
        limit(20),
      ]);

      Logger.verbose(
        `CommentRepo.getRecent() -> ${nadeCommentDocs.length}  | DB`
      );

      return nadeCommentDocs.map(this.toDto);
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to recent comments");
    }
  };

  createComment = async (
    user: UserMiniDto,
    commentModel: CommentCreateDto
  ): Promise<CommentDto> => {
    try {
      const newComment: AddModel<CommentModel> = {
        ...commentModel,
        steamId: user.steamId,
        avatar: user.avatar,
        nickname: user.nickname,
        role: user.role,
        createdAt: value("serverDate"),
        updatedAt: value("serverDate"),
      };
      const res = await add(this.collection, newComment);
      const comment = await this.getById(res.id);

      if (!comment) {
        throw ErrorFactory.InternalServerError(
          "Failed to find comment after save"
        );
      }

      Logger.verbose(`CommentRepo.createComment(${commentModel.nadeId})`);

      return comment;
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to recent comments");
    }
  };

  updateComment = async (
    updateModel: CommentUpddateDto
  ): Promise<CommentDto> => {
    try {
      await update(this.collection, updateModel.id, {
        message: updateModel.message,
      });

      const comment = await this.getById(updateModel.id);

      if (!comment) {
        throw ErrorFactory.InternalServerError(
          "Failed to find comment after update"
        );
      }

      Logger.verbose(`CommentRepo.updateComment(${updateModel.id})`);

      return comment;
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to get updated comment");
    }
  };

  deleteComment = async (commentId: string) => {
    try {
      await remove(this.collection, commentId);
      Logger.verbose(`CommentRepo.deleteComment(${commentId})`);
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError("Failed to delete comment");
    }
  };

  deleteForNadeId = async (nadeId: string) => {
    try {
      const commentsForNade = await query(this.collection, [
        where("nadeId", "==", nadeId),
      ]);

      const { remove, commit } = batch();

      commentsForNade.forEach((comment) => {
        remove(this.collection, comment.ref.id);
      });

      Logger.verbose(
        `CommentRepo.deleteForNadeId(${nadeId}) -> ${commentsForNade.length}`
      );

      await commit();
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError(
        "Failed to delete comments for nade"
      );
    }
  };

  updateUserDetailsForComments = async (user: UserDto) => {
    try {
      const commentsByUser = await query(this.collection, [
        where("steamId", "==", user.steamId),
      ]);

      const { update, commit } = batch();

      commentsByUser.forEach((comment) => {
        update(this.collection, comment.ref.id, {
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
        });
      });

      await commit();

      Logger.verbose(
        `CommentRepo.updateUserDetailsForComments(${user.steamId}) -> ${commentsByUser.length}`
      );
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.InternalServerError(
        "Failed to update user details on users comments"
      );
    }
  };

  private toDto = (doc: Doc<CommentModel>): CommentDto => {
    return {
      id: doc.ref.id,
      ...doc.data,
    };
  };
}
