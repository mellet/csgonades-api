export type CommentDto = {
  id: string;
  nadeId: string;
  steamId: string;
  nickname: string;
  avatar?: string;
  message: string;
  createdAt: Readonly<Date>;
  updatedAt: Readonly<Date>;
};
