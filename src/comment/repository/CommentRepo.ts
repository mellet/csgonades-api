import { UserDto, UserMiniDto } from "../../user/UserDTOs";
import { CommentCreateDto } from "../dto/CommentCreateDto";
import { CommentDto } from "../dto/CommentDto";
import { CommentUpddateDto } from "../dto/CommentUpddateDto";

export interface CommentRepo {
  getForNade(nadeId: string): Promise<CommentDto[]>;
  getById(commentId: string): Promise<CommentDto | null>;
  getRecent(): Promise<CommentDto[]>;
  createComment(
    user: UserMiniDto,
    articleModel: CommentCreateDto
  ): Promise<CommentDto>;
  updateComment(updateModel: CommentUpddateDto): Promise<CommentDto>;
  deleteComment(commentId: string): Promise<void>;
  deleteForNadeId(nadeId: string): Promise<void>;
  updateUserDetailsForComments(user: UserDto): Promise<void>;
}
