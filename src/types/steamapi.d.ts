declare module "steamapi" {
  export type SteamPlayerSummary = {
    avatar: {
      small: string;
      medium: string;
      large: string;
    };
    steamID: string;
    url: string;
    created: number;
    lastLogOff: number;
    nickname: string;
    realName: string;
    primaryGroupID: string;
    personaState: number;
    personaStateFlags: number;
    commentPermission: number;
    visibilityState: number;
    countryCode: string;
  };

  export default class SteamApi {
    constructor(secret: string);

    getUserSummary(steamId: string): Promise<SteamPlayerSummary>;
  }
}
