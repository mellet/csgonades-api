import * as Sentry from "@sentry/node";
import Gfycat, { GfycatDetailsResponse } from "gfycat-sdk";
import { CSGNConfig } from "../config/enironment";
import { Logger } from "../logger/Logger";
import { extractGfyIdFromIdOrUrl } from "../utils/Common";

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
  ): Promise<GfycatDetailsResponse | null> => {
    try {
      const gfyId = extractGfyIdFromIdOrUrl(gfyIdOrUrl);
      const gfyResponse = await this.gfycatSdk.getGifDetails({ gfyId });
      return gfyResponse;
    } catch (error) {
      Logger.error(error);
      Sentry.captureException(error);
      return null;
    }
  };
}
