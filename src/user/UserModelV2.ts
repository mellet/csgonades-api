import { getModelForClass, prop } from "@typegoose/typegoose";

export type Role = "administrator" | "moderator" | "user";

class User {
  @prop({ required: true })
  public nickname!: string;

  @prop({ required: true })
  public steamId!: string;

  @prop({ required: true })
  public avatar!: string;

  @prop({ required: true })
  public role!: Role;

  @prop({ required: true })
  public lastActive: Date;

  @prop()
  public email?: String;

  @prop()
  public bio?: String;
}

export const UserModelV2 = getModelForClass(User);
