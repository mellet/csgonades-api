import { mongoose } from "@typegoose/typegoose";
import { Document, Schema } from "mongoose";

interface BaseNotification extends Document {
  subjectSteamId: string;
  viewed: boolean;
  createdAt: Date;
}

interface FavoriteNotification extends BaseNotification {
  _type: "FavoriteNotification";
  subjectSteamId: string;
  nadeId: string;
  favoritedBy: string[];
  viewed: boolean;
  createdAt: Date;
  favoriteCount: number;
}

interface AcceptedNadeNotification extends BaseNotification {
  _type: "AcceptedNadeNotification";
  nadeId: string;
}

type Notification = FavoriteNotification | AcceptedNadeNotification;

const baseNotificationModel = mongoose.model<Notification>(
  "BaseNotification",
  new Schema(
    {
      subjectSteamId: { type: String, required: true },
      viewed: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    },
    {
      discriminatorKey: "_type",
      collection: "notifications"
    }
  )
);

const favoriteNotificationSchema = new Schema({
  nadeId: { type: String, required: true },
  favoritedBy: { type: [String], required: true }
});

favoriteNotificationSchema.virtual("favoriteCount").get(function() {
  return this.favoritedBy.length;
});

export const FavoriteNotification = baseNotificationModel.discriminator<
  FavoriteNotification
>("FavoriteNotification", favoriteNotificationSchema);

const acceptedNadeNotificationSchema = new Schema({
  nadeId: { type: String, required: true }
});

export const AcceptedNotification = baseNotificationModel.discriminator<
  AcceptedNadeNotification
>("AcceptedNadeNotification", acceptedNadeNotificationSchema);

export default baseNotificationModel;
