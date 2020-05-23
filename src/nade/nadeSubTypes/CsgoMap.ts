const CsGoMaps = {
  dust2: "Dust2",
  mirage: "Mirage",
  nuke: "Nuke",
  inferno: "Inferno",
  cache: "Cache",
  overpass: "Overpass",
  vertigo: "Vertigo",
  train: "Train",
  cobblestone: "Cobblestone",
  anubis: "Anubis",
};

export function nadeValidMaps() {
  const maps: string[] = [];
  for (const key in CsGoMaps) {
    maps.push(key);
  }
  return maps;
}

export type CsgoMap = keyof typeof CsGoMaps;
