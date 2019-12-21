import { CSGNConfig } from "../config/enironment";
import SteamAPI, { SteamPlayerSummary } from "steamapi";
import { AppResult, AppError } from "../utils/Common";
import { ok, err } from "neverthrow";

export interface ISteamService {
  getPlayerBySteamID(steamID: string): AppResult<SteamPlayerSummary>;
}

export class SteamService implements ISteamService {
  private steamApi: SteamAPI;

  constructor(config: CSGNConfig) {
    this.steamApi = new SteamAPI(config.secrets.steam_api_key);
  }

  async getPlayerBySteamID(steamID: string): AppResult<SteamPlayerSummary> {
    try {
      const steamPlayerSummary = await this.steamApi.getUserSummary(steamID);
      return ok(steamPlayerSummary);
    } catch (error) {
      const appError: AppError = {
        status: 500,
        message: "Steam API looks to be down"
      };
      return err(appError);
    }
  }
}
