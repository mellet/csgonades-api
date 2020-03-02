import NotificationModel, { FavoriteNotification } from "./NotificationModel";

export class NotificationRepoV2 {
  model: typeof NotificationModel;

  constructor(model: typeof NotificationModel) {
    this.model = model;
  }

  getNotificationForUser = async (steamId: string) => {
    const result = await this.model.find({ subjectSteamId: steamId }).exec();

    return result;
  };

  createOrUpdateFavoriteNotification = async (
    subjectSteamId: string,
    nadeId: string,
    bySteamId: string
  ) => {
    const filter = {
      nadeId,
      subjectSteamId,
      viewed: false
    };
    const updateArray = {
      $push: {
        favoritedBy: bySteamId
      },
      createdAt: new Date()
    };

    const updatedNoti = await FavoriteNotification.findOneAndUpdate(
      filter,
      updateArray,
      { new: true }
    );

    if (updatedNoti) {
      return updatedNoti;
    }

    const newNoti = await FavoriteNotification.create({
      subjectSteamId,
      nadeId,
      favoritedBy: [bySteamId]
    });

    return newNoti;
  };
}
