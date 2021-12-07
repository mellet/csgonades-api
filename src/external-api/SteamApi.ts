import SteamAPI, { SteamPlayerSummary } from "steamapi";
import { CSGNConfig, makeConfig } from "../config/enironment";
import { Logger } from "../logger/Logger";
import { ErrorFactory } from "../utils/ErrorUtil";

export class SteamApi {
  private steamApi: SteamAPI;

  constructor(config: CSGNConfig = makeConfig()) {
    this.steamApi = new SteamAPI(config.secrets.steam_api_key);
  }

  public getPlayerBySteamID = async (
    steamID: string
  ): Promise<SteamPlayerSummary> => {
    try {
      return await this.steamApi.getUserSummary(steamID);
    } catch (error) {
      Logger.error(error);
      throw ErrorFactory.ExternalError("Steam API down");
    }
  };
}
