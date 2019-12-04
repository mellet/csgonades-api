declare module "passport-steam" {
  type Options = {
    returnURL: string;
    realm: string;
    apiKey: string;
    profile?: boolean;
  };

  type SteamProfile = {
    provider: string;
    _json: {
      steamid: string;
      communityvisibilitystate: number;
      profilestate: number;
      personaname: string;
      lastlogoff: number;
      commentpermission: number;
      profileurl: string;
      avatar: string;
      avatarmedium: string;
      avatarfull: string;
      personastate: number;
      realname: string;
      primaryclanid: string;
      timecreated: number;
      personastateflags: number;
      loccountrycode: string;
      locstatecode: string;
      loccityid: number;
    };
    id: string;
    displayName: string;
    photos: { value: string }[];
  };

  type ValidateFunc = (
    identifier: string,
    profile: SteamProfile,
    done: Function
  ) => void;

  export default class SteamStrategy {
    constructor(options: Options, identifyFunc: ValidateFunc);
    authenticate(req: any): any;
  }
}
