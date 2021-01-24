export type CommentModel = {
  nadeId: string;
  steamId: string;
  nickname: string;
  avatar?: string;
  message: string;
  createdAt: Readonly<Date>;
  updatedAt: Readonly<Date>;
};
