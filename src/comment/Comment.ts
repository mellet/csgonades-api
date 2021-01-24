export type CommentDoc = {
  nadeId: string;
  steamId: string;
  nickname: string;
  avatar: string;
  message: string;
  createdAt: Date;
  updatedAt: Date | null;
};

export type CommentCreateDto = {
  nadeId: string;
  message: string;
};

export type CommentUpddateDto = {
  id: string;
  message: string;
};

export type CommentDto = {
  id: string;
  nadeId: string;
  steamId: string;
  nickname: string;
  avatar: string;
  message: string;
  createdAt: Date;
  updatedAt: Date | null;
};
