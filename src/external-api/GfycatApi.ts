import Gfycat, { GfycatDetailsResponse } from "gfycat-sdk";
import { CSGNConfig } from "../config/enironment";
import { Logger } from "../logger/Logger";
import { extractGfyIdFromIdOrUrl } from "../utils/Common";
import { ErrorFactory } from "../utils/ErrorUtil";

export class GfycatApi {
  private gfycatSdk: Gfycat;

  constructor(config: CSGNConfig) {
    this.gfycatSdk = new Gfycat({
      clientId: config.secrets.gfycat_id,
      clientSecret: config.secrets.gfycat_secret,
    });
  }

  getGfycatData = async (
    gfyIdOrUrl: string
  ): Promise<GfycatDetailsResponse> => {
    try {
      const gfyId = extractGfyIdFromIdOrUrl(gfyIdOrUrl);
      const gfyResponse = await this.gfycatSdk.getGifDetails({ gfyId });

      Logger.verbose("GfycatApi.getGfycatData", gfyId);
      return gfyResponse;
    } catch (error) {
      Logger.error("GfycatApi.getGfycatData - Gfycat offline", error);
      throw ErrorFactory.ExternalError(`Gfycat offline - ${error.message}`);
    }
  };
}
