import * as Sentry from "@sentry/node";
import { makeConfig } from "../config/enironment";
import { GfycatApi } from "./GfycatApi";

jest.mock("@sentry/node", () => ({
  captureException: jest.fn(),
}));

jest.mock("gfycat-sdk");

describe("Gfycat service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it.skip("captures error when gfycat is down", async () => {
    const config = makeConfig();
    const gfycatApi = new GfycatApi(config);

    const result = await gfycatApi.getGfycatData("https://gfycat.com/error");

    expect(result).toBe(null);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
