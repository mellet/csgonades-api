import * as Sentry from "@sentry/node";
import axios from "axios";
import Gfycat, { GfycatDetailsResponse } from "gfycat-sdk";
import { CSGNConfig } from "../config/enironment";
import { extractGfyIdFromIdOrUrl } from "../utils/Common";

export interface GfycatService {
  getGfycatData(gfyId: string): Promise<GfycatDetailsResponse | null>;
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
  ): Promise<GfycatDetailsResponse | null> {
    try {
      const gfyId = extractGfyIdFromIdOrUrl(gfyIdOrUrl);
      const gfyResponse = await gfycatSdk.getGifDetails({ gfyId });
      return gfyResponse;
    } catch (error) {
      Sentry.captureException(error);
      return null;
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
      return false;
    }
  }

  return { getGfycatData, registerView };
};
