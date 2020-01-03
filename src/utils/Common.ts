export const removeUndefines = <T extends Object>(object: T): T => {
  const newObject = {
    ...object
  };
  Object.keys(newObject).forEach(
    key => newObject[key] === undefined && delete newObject[key]
  );
  return newObject;
};

export function extractGfyIdFromIdOrUrl(gfycatIdOrUrl: string): string {
  const index = gfycatIdOrUrl.lastIndexOf("/");
  const gfyId = gfycatIdOrUrl.substr(index + 1);
  return gfyId;
}
