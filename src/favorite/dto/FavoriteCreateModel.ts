import { FavoriteFireModel } from "./FavoriteFireModel";

export type FavoriteCreateModel = Omit<FavoriteFireModel, "createdAt" | "id">;
