import sanitizer from "sanitizer";

export function sanitizeString<T extends string>(value: T): T {
  const dirtyString = value as string;
  const clean = sanitizer.sanitize(dirtyString) as T;
  return clean;
}

export function sanitizeObject<T extends Object>(dirtyObject: T): T {
  let clean = {} as T;
  Object.keys(dirtyObject).forEach(key => {
    clean[key] = sanitizer.sanitize(dirtyObject[key]);
  });
  return clean;
}
