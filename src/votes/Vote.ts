export type VoteModel = {
  nadeId: string;
  bySteamId: string;
  vote: number;
  createdAt: Date;
  updatedAt?: Date;
};

export type VoteReqBody = Omit<
  VoteModel,
  "createdAt" | "updatedAt" | "bySteamId"
>;

export type VoteDto = VoteModel & { id: string };
