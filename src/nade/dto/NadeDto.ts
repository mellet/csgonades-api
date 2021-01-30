import { NadeFireModel } from "./NadeFireModel";

export interface NadeDto extends NadeFireModel {
  id: string;
  score: number;
}
