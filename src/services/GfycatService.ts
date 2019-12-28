import Gfycat, { GfycatDetailsResponse } from "gfycat-sdk";
import { CSGNConfig } from "../config/enironment";
import { extractGfyIdFromIdOrUrl } from "./GfycatHelper";
import axios from "axios";
import { AppResult } from "../utils/Common";
import { ok, err } from "neverthrow";
import { GfycatData } from "../nade/Nade";

export interface GfycatService {
  getGfycatData(gfyId: string): AppResult<GfycatDetailsResponse>;
  registerView(gfyId: string, identifier: string): Promise<void>;
}

export const makeGfycatService = (configContext: CSGNConfig): GfycatService => {
  const config = configContext;
  const gfycatSdk = new Gfycat({
    clientId: config.secrets.gfycat_id,
    clientSecret: config.secrets.gfycat_secret
  });

  async function getGfycatData(
    gfyIdOrUrl: string
  ): AppResult<GfycatDetailsResponse> {
    try {
      const gfyId = extractGfyIdFromIdOrUrl(gfyIdOrUrl);
      const gfyResponse = await gfycatSdk.getGifDetails({ gfyId });
      return ok(gfyResponse);
    } catch (error) {
      return err(error);
    }
  }

  async function registerView(gfyId: string, identifier: string) {
    const url = `https://px.gfycat.com/px.gif?client_id=${config.secrets.gfycat_id}&ver=1.0.0&utc=${identifier}&gfyid=${gfyId}&context=search&flow=half`;

    try {
      await axios.get(url);
    } catch (error) {
      console.warn("GfycatService.registerView", error.message);
    }
  }

  return { getGfycatData, registerView };
};
