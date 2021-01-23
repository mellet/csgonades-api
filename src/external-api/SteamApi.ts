import SteamAPI, { SteamPlayerSummary } from "steamapi";
import { CSGNConfig, makeConfig } from "../config/enironment";

export class SteamApi {
  private steamApi: SteamAPI;

  constructor(config: CSGNConfig = makeConfig()) {
    this.steamApi = new SteamAPI(config.secrets.steam_api_key);
  }

  getPlayerBySteamID(steamID: string): Promise<SteamPlayerSummary> {
    return this.steamApi.getUserSummary(steamID);
  }
}
