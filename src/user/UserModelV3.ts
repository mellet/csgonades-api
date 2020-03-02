import { mongoose } from "@typegoose/typegoose";
import { Document, Schema } from "mongoose";

export type Role = "administrator" | "moderator" | "user";

interface UserModel extends Document {
  nickname: string;
  steamId: string;
  avatar: string;
  role: Role;
  email?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
}

const requiredString = { type: String, required: true };
const autoDate = { type: Date, default: Date.now };

const userSchema = new Schema({
  nickname: requiredString,
  steamId: requiredString,
  avatar: requiredString,
  role: {
    type: String,
    enum: ["user", "moderator", "administrator"],
    default: "user"
  },
  email: { type: String },
  bio: { type: String },
  createdAt: autoDate,
  updatedAt: autoDate,
  lastActive: autoDate
});

const UserModel = mongoose.model<UserModel>("User", userSchema);
