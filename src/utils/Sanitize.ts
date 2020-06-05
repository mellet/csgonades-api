import sanitizer from "sanitizer";

function sanitizeObj(dirty: any): any {
  let clean = {};
  Object.keys(dirty).forEach((key) => {
    clean[key] = sanitizeIt(dirty[key]);
  });
  return clean;
}

function sanitizeArray(dirty: any): any {
  let clean = [];
  dirty.forEach((d) => {
    // @ts-ignore
    clean.push(sanitizeIt(d));
  });
  return clean;
}

export const sanitizeIt = function <T extends any>(theInput: T): T {
  if (theInput === null || typeof theInput === "undefined") {
    return theInput;
  } else {
    // @ts-ignore
    if (typeof theInput === "object" && theInput.constructor !== Array) {
      return sanitizeObj(theInput);
      // @ts-ignore
    } else if (theInput.constructor === Array) {
      return sanitizeArray(theInput);
    } else {
      // @ts-ignore
      if (typeof theInput === "string") {
        let clean = sanitizer.sanitize(theInput) as any;
        clean = sanitizer.escape(clean);
        return clean;
      } else {
        return theInput;
      }
    }
  }
};
