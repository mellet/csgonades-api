import Gfycat, { GfycatDetailsResponse } from "gfycat-sdk";
import { CSGNConfig } from "../config/enironment";
import axios from "axios";
import { extractGfyIdFromIdOrUrl } from "../utils/Common";
import * as Sentry from "@sentry/node";

export interface GfycatService {
  getGfycatData(gfyId: string): Promise<GfycatDetailsResponse>;
  registerView(gfyId: string, identifier: string): Promise<boolean>;
}

export const makeGfycatService = (configContext: CSGNConfig): GfycatService => {
  const config = configContext;
  const gfycatSdk = new Gfycat({
    clientId: config.secrets.gfycat_id,
    clientSecret: config.secrets.gfycat_secret
  });

  async function getGfycatData(
    gfyIdOrUrl: string
  ): Promise<GfycatDetailsResponse> {
    try {
      const gfyId = extractGfyIdFromIdOrUrl(gfyIdOrUrl);
      const gfyResponse = await gfycatSdk.getGifDetails({ gfyId });
      return gfyResponse;
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  async function registerView(
    gfyId: string,
    identifier: string
  ): Promise<boolean> {
    const url = `https://px.gfycat.com/px.gif?client_id=${config.secrets.gfycat_id}&ver=1.0.0&utc=${identifier}&gfyid=${gfyId}&context=search&flow=half`;

    try {
      await axios.get(url);
      return true;
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  return { getGfycatData, registerView };
};
