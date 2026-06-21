/**
 * comparesApi.test.ts — Node transport for user comparisons.
 *
 * Asserts exact endpoint path (note the trailing slash on POST /compares/),
 * method, payload, and returned shape for all three functions.
 */

import { comparesApi } from "@/api/comparesApi";
import { nodeApi } from "@/api/nodeApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("comparesApi.toggleCompare", () => {
  it("POSTs /compares/ (trailing slash) with { itemID, itemType }", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { type: "success", compareCount: 3 },
    });

    const result = await comparesApi.toggleCompare("inst-1", "Institution");

    expect((nodeApi.post as jest.Mock).mock.calls[0][0]).toBe("/compares/");
    expect((nodeApi.post as jest.Mock).mock.calls[0][1]).toEqual({
      itemID: "inst-1",
      itemType: "Institution",
    });
    expect(result).toEqual({ type: "success", compareCount: 3 });
  });

  it("propagates a rejection", async () => {
    (nodeApi.post as jest.Mock).mockRejectedValueOnce(new Error("oops"));
    await expect(comparesApi.toggleCompare("p", "Program")).rejects.toThrow(
      "oops"
    );
  });
});

describe("comparesApi.getCompareIds", () => {
  it("GETs /compares/:type and maps to itemID list", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        type: "success",
        data: [
          { _id: "a", itemID: "c1", itemType: "Program", userId: "u" },
          { _id: "b", itemID: "c2", itemType: "Program", userId: "u" },
        ],
      },
    });

    const result = await comparesApi.getCompareIds("Program");

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe("/compares/Program");
    expect(result).toEqual(["c1", "c2"]);
  });

  it("returns [] when type is not 'success'", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { type: "error", data: [] },
    });
    expect(await comparesApi.getCompareIds("Institution")).toEqual([]);
  });
});

describe("comparesApi.getCompareCount", () => {
  it("GETs /compares/count/:type and returns the count", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { type: "success", data: { count: 4 } },
    });

    const result = await comparesApi.getCompareCount("Program");

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe(
      "/compares/count/Program"
    );
    expect(result).toBe(4);
  });

  it("returns 0 when count is missing on a success response", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { type: "success", data: {} },
    });
    expect(await comparesApi.getCompareCount("Program")).toBe(0);
  });

  it("returns 0 when type is not 'success'", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { type: "error" },
    });
    expect(await comparesApi.getCompareCount("Institution")).toBe(0);
  });

  it("returns 0 (swallows error) on rejection", async () => {
    (nodeApi.get as jest.Mock).mockRejectedValueOnce(new Error("down"));
    expect(await comparesApi.getCompareCount("Institution")).toBe(0);
  });
});
