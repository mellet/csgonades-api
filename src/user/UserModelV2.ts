import { getModelForClass, prop, Typegoose } from "@typegoose/typegoose";
import { ValidatorFunction } from "@typegoose/typegoose/lib/types";
import { Role } from "./UserModel";

const validateEmail: ValidatorFunction = (email: any) => {
  var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
  return emailRegex.test(email.text);
};

class User extends Typegoose {
  @prop({ required: true })
  public nickname: string;

  @prop({ required: true })
  public steamId: string;

  @prop({ required: true })
  public avatar: string;

  @prop({ required: true, default: "user" })
  public role: Role;

  @prop({ validate: validateEmail })
  public email?: string;

  @prop()
  public bio?: string;

  @prop({ required: true, default: Date.now })
  public createdAt: Date;

  @prop({ required: true, default: Date.now })
  public updatedAt: Date;

  @prop({ required: true, default: Date.now })
  public lastActive: Date;
}

export const UserModelV2 = new User().getModelForClass(User);

const test = getModelForClass(User);

test.create();
