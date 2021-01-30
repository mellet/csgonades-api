import { ErrorFactory } from "./ErrorUtil";

export const removeUndefines = <T extends Object>(object: T): T => {
  const newObject = {
    ...object,
  };
  Object.keys(newObject).forEach(
    (key) => newObject[key] === undefined && delete newObject[key]
  );
  return newObject;
};

export function extractGfyIdFromIdOrUrl(gfycatIdOrUrl: string): string {
  const index = gfycatIdOrUrl.lastIndexOf("/");
  const gfyId = gfycatIdOrUrl.substr(index + 1);
  return gfyId;
}

export function clamp(num: number, min: number, max: number) {
  return num <= min ? min : num >= max ? max : num;
}

export function assertNever(never: never) {
  return ErrorFactory.InternalServerError(`Did not expect to reach this code.`);
  // no-op
}
