import { CSGNConfig } from "../config/enironment";
import SteamAPI, { SteamPlayerSummary } from "steamapi";
import { CSGNUser, makeUser } from "../user/User";

export interface SteamService {
  getPlayerBySteamID(steamID: string): Promise<SteamPlayerSummary>;
}

export const makeSteamService = (config: CSGNConfig): SteamService => {
  const steamApi = new SteamAPI(config.secrets.steam_api_key);

  async function getPlayerBySteamID(
    steamID: string
  ): Promise<SteamPlayerSummary> {
    const steamPlayerSummary = await steamApi.getUserSummary(steamID);

    return steamPlayerSummary;
  }

  return {
    getPlayerBySteamID
  };
};
