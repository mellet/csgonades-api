import joi from "joi";

export type CsgoMap = "dust2" | "mirage" | "nuke" | "inferno";

type Movement = "stationary" | "running" | "walking" | "crouching";

type Technique = "mouseleft" | "mouseright" | "mouseboth" | "jumpthrow";

type Tickrate = "64tick" | "128 tick" | "Any";

type NadeType = "smoke" | "flash" | "molotov" | "he-grenade";

type NadeStats = {
  comments: number;
  favorited: number;
  views: number;
};

export type Nade = {
  id: string;
  title?: string;
  description?: string;
  map?: CsgoMap;
  gfyID: string;
  stats: NadeStats;
  movement?: Movement;
  technique?: Technique;
  tickrate?: Tickrate;
  type?: NadeType;
  createAt: number;
  updatedAt: number;
};

const nadeSchema = joi.object({
  title: joi.string().optional(),
  description: joi.string().optional(),
  map: joi
    .string()
    .allow(["dust2", "mirage", "nuke", "inferno"])
    .optional(),
  gfyID: joi.string().required(),
  movement: joi
    .string()
    .allow(["stationary", "running", "walking", "crouching"])
    .optional()
});

export const makeMinimalNade = (gfyID: string): Nade => {
  return {
    id: "",
    gfyID,
    stats: {
      comments: 0,
      favorited: 0,
      views: 0
    },
    createAt: Date.now(),
    updatedAt: Date.now()
  };
};

export const parseNadeFromBody = (
  nade: string
): { nade: Nade; error: Error } => {
  try {
    const parsedNade = JSON.parse(nade) as Nade;
    const { error } = joi.validate(parsedNade, nadeSchema);
    if (error) {
      return { nade: null, error };
    }
    return { nade: parsedNade, error: null };
  } catch (error) {
    return { nade: null, error };
  }
};
