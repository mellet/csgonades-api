import { extractGfyIdFromIdOrUrl } from "./GfycatHelper";

describe("Gfycat helper tests", () => {
  it("Extracts gfyId correcly", () => {
    const testValue1 = "https://www.gfycat.com/correctId";
    const testValue2 = "https://gfycat.com/correctId";
    const testValue3 = "http://gfycat.com/correctId";
    const testValue4 = "gfycat.com/correctId";
    const testValue5 = "correctId";

    const result1 = extractGfyIdFromIdOrUrl(testValue1);
    const result2 = extractGfyIdFromIdOrUrl(testValue2);
    const result3 = extractGfyIdFromIdOrUrl(testValue3);
    const result4 = extractGfyIdFromIdOrUrl(testValue4);
    const result5 = extractGfyIdFromIdOrUrl(testValue5);

    expect(result1).toEqual("correctId");
    expect(result2).toEqual("correctId");
    expect(result3).toEqual("correctId");
    expect(result4).toEqual("correctId");
    expect(result5).toEqual("correctId");
  });
});
