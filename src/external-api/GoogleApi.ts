import axios from "axios";
import { CSGNConfig } from "../config/enironment";
import { Logger } from "../logger/Logger";

export class GoogleApi {
  private config: CSGNConfig;

  constructor(config: CSGNConfig) {
    this.config = config;
  }

  public async getYouTubeVideoViewCount(youTubeId: string): Promise<number> {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${youTubeId}&key=${this.config.google.apiKey}`
      );
      const stats = response.data.items[0].statistics.viewCount;
      return stats;
    } catch (error) {
      Logger.error("GoogleApi failed", error);
      throw error;
    }
  }
}
