import { Request } from "express";

export type NadeFilter = {
  smoke: boolean;
  molotov: boolean;
  hegrenade: boolean;
  flash: boolean;
};

export const nadeFilterFromRequest = (req: Request): NadeFilter => {
  const smoke = req?.query?.smoke === "true";
  const molotov = req?.query?.molotov === "true";
  const hegrenade = req?.query?.hegrenade === "true";
  const flash = req?.query?.flash === "true";

  const filter = {
    flash: !!flash,
    smoke: !!smoke,
    molotov: !!molotov,
    hegrenade: !!hegrenade
  };

  return filter;
};
