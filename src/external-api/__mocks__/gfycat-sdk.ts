export default class Gfycat {
  constructor() {}

  async getGifDetails({ gfyId }: { gfyId: string }) {
    if (gfyId === "error") {
      throw Error();
    } else {
      return {
        statusCode: 200,
        gfyItem: {
          gfyId: "idioticadventurousarabianoryx",
          mobileUrl: "mobileUrl",
          mp4Url: "mp4Url",
          frameRate: 24,
          numFrames: 24 * 60, // one minute long
        },
      };
    }
  }
}
