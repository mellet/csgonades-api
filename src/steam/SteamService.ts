import SteamAPI, { SteamPlayerSummary } from "steamapi";
import { CSGNConfig } from "../config/enironment";

export interface ISteamService {
  getPlayerBySteamID(steamID: string): Promise<SteamPlayerSummary>;
}

export class SteamService implements ISteamService {
  private steamApi: SteamAPI;

  constructor(config: CSGNConfig) {
    this.steamApi = new SteamAPI(config.secrets.steam_api_key);
  }

  getPlayerBySteamID(steamID: string): Promise<SteamPlayerSummary> {
    return this.steamApi.getUserSummary(steamID);
  }
}
