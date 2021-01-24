import {
  DocumentType,
  getModelForClass,
  prop,
  ReturnModelType,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { CommentDto } from "../dto/CommentDto";

export type Role = "administrator" | "moderator" | "user";

export class Comment extends TimeStamps {
  @prop({ required: true })
  nadeId!: string;

  @prop()
  avatar?: string;

  @prop({ required: true })
  message!: string;

  @prop({ required: true })
  nickname!: string;

  @prop({ required: true })
  steamId!: string;
}

export const CommentModelV2 = getModelForClass(Comment);

export type CommentModelType = ReturnModelType<typeof Comment, unknown>;

export function commentDocToDto(model: DocumentType<Comment>): CommentDto {
  return {
    id: model._id,
    message: model.message,
    nadeId: model.nadeId,
    nickname: model.nickname,
    steamId: model.steamId,
    avatar: model.avatar,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}
