const CsGoMaps = {
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
  for (const key in CsGoMaps) {
    maps.push(key);
  }
  return maps;
}

export type CsgoMap = keyof typeof CsGoMaps;
