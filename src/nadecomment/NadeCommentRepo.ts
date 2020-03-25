import {
  add,
  collection,
  Collection,
  get,
  query,
  remove,
  update,
  value,
  where
} from "typesaurus";
import { ErrorFactory } from "../utils/ErrorUtil";
import {
  NadeCommentDoc,
  NadeCommentDto,
  NadeCommentUpdateDTO
} from "./NadeComment";

export class NadeCommentRepo {
  private collection: Collection<NadeCommentDoc>;

  constructor() {
    this.collection = collection<NadeCommentDoc>("nadecomments");
  }

  getForNade = async (nadeId: string): Promise<NadeCommentDto[]> => {
    const nadeCommentDocs = await query(this.collection, [
      where("nadeId", "==", nadeId)
    ]);

    const nadeComments: NadeCommentDto[] = nadeCommentDocs.map(doc => ({
      id: doc.ref.id,
      ...doc.data
    }));
    return nadeComments;
  };

  getById = async (commentId: string): Promise<NadeCommentDto> => {
    const commentDoc = await get(this.collection, commentId);

    if (!commentDoc) {
      throw ErrorFactory.NotFound("Comment not found");
    }

    return {
      ...commentDoc.data,
      id: commentDoc.ref.id
    };
  };

  save = async (articleModel: NadeCommentDoc): Promise<NadeCommentDto> => {
    const newComment: NadeCommentDoc = {
      ...articleModel,
      createdAt: value("serverDate")
    };

    const res = await add(this.collection, newComment);

    return {
      ...res.data,
      id: res.ref.id
    };
  };

  update = async (
    updateModel: NadeCommentUpdateDTO
  ): Promise<NadeCommentDto> => {
    await update(this.collection, updateModel.id, {
      message: updateModel.message
    });

    return this.getById(updateModel.id);
  };

  delete = async (commentId: string) => {
    await remove(this.collection, commentId);
  };
}
