export const NadeTypes = {
  smoke: "Smoke",
  flash: "Flash",
  molotov: "Molotov",
  hegrenade: "Grenade",
};

export type NadeType = keyof typeof NadeTypes;

export function nadeValidTypes() {
  const maps: string[] = [];
  for (const key in NadeTypes) {
    maps.push(key);
  }
  return maps;
}
