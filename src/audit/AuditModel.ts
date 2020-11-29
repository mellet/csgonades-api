import { Role } from "../user/UserModel";

export type UserAudit = {
  nickname: string;
  steamId: string;
  avatar: string;
  role: Role;
};

type EventName = "updateNade";

export type AuditModel = {
  byUser: UserAudit;
  createdAt: Date;
  name: EventName;
  description: string;
  onNadeId: string;
};

export type CreateAuditDto = {
  byUser: UserAudit;
  name: EventName;
  description: string;
  onNadeId: string;
};

export type AuditDto = {
  id: string;
  byUser: UserAudit;
  createdAt: Date;
  name: EventName;
  description: string;
  onNadeId: string;
};
