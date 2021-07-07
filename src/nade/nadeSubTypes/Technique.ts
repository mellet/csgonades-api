const TechniqueValues = {
  left: "Mouse left",
  right: "Mouse right",
  both: "Mouse both",
  jumpthrow: "Jumpthrow bind",
  jumpthrowW: "Jumpthrow + W",
  jumpthrowBoth: "Jumpthrow Mouse Both",
};

export type Technique = keyof typeof TechniqueValues;

export const nadeValidTechniques = () => {
  const maps: string[] = [];
  for (const key in TechniqueValues) {
    maps.push(key);
  }
  return maps;
};
