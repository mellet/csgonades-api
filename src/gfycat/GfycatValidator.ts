class GfycatValidator {
  validate = (gfycatID: string): boolean => {
    return true;
  };
}

let gfycatValidator: GfycatValidator = null;

export const makeGfycatValidator = () => {
  if (!gfycatValidator) {
    gfycatValidator = new GfycatValidator();
  }
  return gfycatValidator;
};
