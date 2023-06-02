export const GameModes = {
  csgo: "csgo",
  cs2: "cs2",
};

export type GameMode = keyof typeof GameModes;

export function nadeValidGameModes() {
  const maps: string[] = [];
  for (const key in GameModes) {
    maps.push(key);
  }
  return maps;
}
