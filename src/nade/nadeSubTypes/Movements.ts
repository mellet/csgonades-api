export const NadeMovements = {
  stationary: "Stationary",
  crouching: "Crouching",
  walking: "Walking",
  running: "Running",
  crouchwalking: "Crouchwalking",
};

export type Movement = keyof typeof NadeMovements;

export function nadeValidMovements() {
  const maps: string[] = [];
  for (const key in NadeMovements) {
    maps.push(key);
  }
  return maps;
}
