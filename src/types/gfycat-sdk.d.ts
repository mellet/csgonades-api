declare module "gfycat-sdk" {
  type GfycatConfig = {
    clientId: string;
    clientSecret: string;
    timeout?: number;
  };

  type GfycatSearchOptions = {
    search_text: string;
    count?: number;
    first?: number;
    cursor?: string;
  };

  type GifDetailsOptions = {
    gfyId: string;
  };

  type AuthOptions = {
    client_id: string;
    client_secret: string;
    grant_type?: "client_credentials";
    callback?: Function;
  };

  export type GfycatDetailsResponse = {
    gfyItem: {
      tags: string[];
      languageCategories: string[];
      domainWhitelist: string[];
      geoWhitelist: string[];
      published: number;
      nsfw: string;
      gatekeeper: number;
      mp4Url: string;
      gifUrl: string;
      webmUrl: string;
      webpUrl: string;
      mobileUrl: string;
      mobilePosterUrl: string;
      extraLemmas: string;
      thumb100PosterUrl: string;
      miniUrl: string;
      gif100px: string;
      miniPosterUrl: string;
      max5mbGif: string;
      title: string;
      max2mbGif: string;
      max1mbGif: string;
      posterUrl: string;
      languageText: string;
      views: number;
      userName: string;
      description: string;
      hasTransparency: boolean;
      hasAudio: boolean;
      likes: string;
      dislikes: string;
      gfyNumber: string;
      gfyId: string;
      gfyName: string;
      avgColor: string;
      width: number;
      height: number;
      frameRate: number;
      numFrames: number;
      mp4Size: number;
      webmSize: number;
      createDate: number;
      md5: string;
      source: string;
    };
    statusCode: number;
  };

  type AuthResponse = {
    access_token: string;
  };

  export default class Gfycat {
    constructor(config: GfycatConfig);

    authenticate(options: AuthOptions, callback?: Function): AuthResponse;

    getGifDetails(
      options: GifDetailsOptions,
      callback?: Function
    ): Promise<GfycatDetailsResponse>;

    search(options: GfycatSearchOptions, callback?: Function): Promise<any>;
  }
}
