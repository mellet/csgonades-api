import { NadeFireModel } from "./NadeFireModel";

export interface NadeDto extends NadeFireModel {
  id: string;
  nextUpdateInHours: number;
  score: number;
}
