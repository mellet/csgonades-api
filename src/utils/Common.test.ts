import { assertNever, clamp, removeUndefines } from "./Common";

describe("Common utils", () => {
  it("removes undefined from object", () => {
    const test = {
      name: "name",
      age: undefined,
    };

    const expected = {
      name: "name",
    };

    const result = removeUndefines(test);

    expect(result).toMatchObject(expected);
  });

  it("clamps high values down", () => {
    const result = clamp(20, 10, 18);
    expect(result).toEqual(18);
  });

  it("clamps low values up", () => {
    const result = clamp(1, 10, 18);
    expect(result).toEqual(10);
  });

  it("does not clamp if not needed", () => {
    const result = clamp(12, 10, 18);
    expect(result).toEqual(12);
  });

  it("assertNever", () => {
    let someValue = 0 as never;

    const result = assertNever(someValue);
    expect(result.message).toEqual("Did not expect to reach this code.");
  });
});
