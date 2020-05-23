const TechniqueValues = {
  left: "Mouse left",
  right: "Mouse right",
  both: "Mouse both",
  jumpthrow: "Jumpthrow bind",
};

export type Technique = keyof typeof TechniqueValues;

export const nadeValidTechniques = () => {
  const maps: string[] = [];
  for (const key in TechniqueValues) {
    maps.push(key);
  }
  return maps;
};
