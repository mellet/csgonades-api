export type NadeCommentDoc = {
  nadeId: string;
  steamId: string;
  nickname: string;
  avatar: string;
  message: string;
  createdAt: Date;
  updatedAt: Date | null;
};

export type NadeCommentCreateDTO = {
  nadeId: string;
  message: string;
};

export type NadeCommentUpdateDTO = {
  id: string;
  message: string;
};

export type NadeCommentDto = {
  id: string;
  nadeId: string;
  steamId: string;
  nickname: string;
  avatar: string;
  message: string;
  createdAt: Date;
  updatedAt: Date | null;
};
