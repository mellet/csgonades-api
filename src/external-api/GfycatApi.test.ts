import { makeConfig } from "../config/enironment";
import { GfycatApi } from "./GfycatApi";

describe("Gfycat service", () => {
  it("Compiles", () => {
    const config = makeConfig();
    const gfycatApi = new GfycatApi(config);
    expect(gfycatApi.getGfycatData).toBeDefined();
  });

  it.skip("Fetches gfycat data correcty", async () => {
    const config = makeConfig();
    const gfycatApi = new GfycatApi(config);

    const result = await gfycatApi.getGfycatData(
      "https://gfycat.com/idioticadventurousarabianoryx"
    );

    expect(result).not.toBe(null);
    expect(result?.statusCode).toBe(200);
    expect(result?.gfyItem.gfyId).toBe("idioticadventurousarabianoryx");
  });
});
