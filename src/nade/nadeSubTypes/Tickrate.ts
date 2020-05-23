export const NadeTickrate = {
  any: "Both",
  tick64: "64 Tick",
  tick128: "128 Tick",
};

export type Tickrate = keyof typeof NadeTickrate;

export function nadeValidTickrate() {
  const maps: string[] = [];
  for (const key in NadeTickrate) {
    maps.push(key);
  }
  return maps;
}
