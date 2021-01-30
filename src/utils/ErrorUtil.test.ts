import { CustomErr, errorCatchConverter, ErrorFactory } from "./ErrorUtil";

describe("ErrorUtil", () => {
  it("Creates correct external error", () => {
    const errorMessage = "Fail";
    const result = ErrorFactory.ExternalError(errorMessage);
    expect(result.message).toEqual(errorMessage);
    expect(result.code).toEqual(500);
  });

  it("converts error correctly", () => {
    const fake = new CustomErr(123, "Error");

    const res = errorCatchConverter(fake);
    expect(res.code).toEqual(123);
    expect(res.message).toEqual("Error");
  });

  it("converts error correctly when unknown", () => {
    const res = errorCatchConverter({});
    expect(res.code).toEqual(500);
    expect(res.message).toEqual("Unknown error");
  });
});
