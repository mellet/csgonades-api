import { makeConfig } from "../config/enironment";
import { makeGfycatService } from "./GfycatService";

describe("Gfycat service", () => {
  it("Compiles", () => {
    const config = makeConfig();
    const gfycatService = makeGfycatService(config);
    expect(gfycatService.getGfycatData).toBeDefined();
  });

  it.skip("Fetches gfycat data correcty", async () => {
    const config = makeConfig();
    const gfycatService = makeGfycatService(config);

    const result = await gfycatService.getGfycatData(
      "https://gfycat.com/idioticadventurousarabianoryx"
    );

    expect(result.statusCode).toBe(200);
    expect(result.gfyItem.gfyId).toBe("idioticadventurousarabianoryx");
  });
});
