const CsMaps = {
  ancient: "Ancient",
  anubis: "Anubis",
  cache: "Cache",
  cobblestone: "Cobblestone",
  tuscan: "Tuscan",
  dust2: "Dust2",
  inferno: "Inferno",
  mirage: "Mirage",
  nuke: "Nuke",
  overpass: "Overpass",
  train: "Train",
  vertigo: "Vertigo",
};

export function nadeValidMaps() {
  const maps: string[] = [];
  for (const key in CsMaps) {
    maps.push(key);
  }
  return maps;
}

export type CsMap = keyof typeof CsMaps;
