export const NadeTeamSide = {
  both: "Both",
  counterTerrorist: "Counter-Terrorist",
  terrorist: "Terrorist",
};

export type TeamSide = keyof typeof NadeTeamSide;

export function nadeValidTeamSide() {
  const maps: string[] = [];
  for (const key in NadeTeamSide) {
    maps.push(key);
  }
  return maps;
}
