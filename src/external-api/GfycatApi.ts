import * as Sentry from "@sentry/node";
import axios from "axios";
import Gfycat, { GfycatDetailsResponse } from "gfycat-sdk";
import { CSGNConfig, makeConfig } from "../config/enironment";
import { extractGfyIdFromIdOrUrl } from "../utils/Common";

export class GfycatApi {
  private config: CSGNConfig;
  private gfycatSdk: Gfycat;

  constructor(config: CSGNConfig = makeConfig()) {
    this.config = config;
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
      Sentry.captureException(error);
      return null;
    }
  };

  registerView = async (
    gfyId: string,
    identifier: string
  ): Promise<boolean> => {
    const url = `https://px.gfycat.com/px.gif?client_id=${this.config.secrets.gfycat_id}&ver=1.0.0&utc=${identifier}&gfyid=${gfyId}&context=search&flow=half`;

    try {
      await axios.get(url);
      return true;
    } catch (error) {
      Sentry.captureException(error);
      return false;
    }
  };
}
