/**
 * offeringsFilterApi.test.ts — Strapi filter endpoints for offerings.
 *
 * `http` is globally mocked. Both methods return res.data when it is an array,
 * otherwise []; and swallow rejections, returning [].
 *
 * Coverage: fetchCategories + fetchFields — happy path (URL + passthrough),
 * non-array guard, rejection → [], locale passthrough.
 */

import { http } from "@/api/http";
import { offeringsFilterApi } from "@/api/offeringsFilterApi";

const mockGet = http.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── fetchCategories ────────────────────────────────────────────────────────────

describe("offeringsFilterApi.fetchCategories", () => {
  it("returns the array response unchanged and hits category-usage URL", async () => {
    const rows = [
      { category: { id: 1, name: "Test Prep", icon: "book" }, offerings: [10, 11] },
      { category: { id: 2, name: "Coaching" }, offerings: [] },
    ];
    mockGet.mockResolvedValueOnce({ data: rows });
    const result = await offeringsFilterApi.fetchCategories("en");
    expect(result).toBe(rows); // returned as-is (no transform)
    expect(mockGet).toHaveBeenCalledWith(
      "/api/offerings/category-usage?status=draft&locale=en"
    );
  });

  it("passes the ar locale through", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    await offeringsFilterApi.fetchCategories("ar");
    expect(mockGet).toHaveBeenCalledWith(
      "/api/offerings/category-usage?status=draft&locale=ar"
    );
  });

  it("returns [] when data is not an array (e.g. {} from a bad response)", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    expect(await offeringsFilterApi.fetchCategories("en")).toEqual([]);
  });

  it("returns [] when the request rejects (catch branch)", async () => {
    mockGet.mockRejectedValueOnce(new Error("network down"));
    expect(await offeringsFilterApi.fetchCategories("en")).toEqual([]);
  });
});

// ─── fetchFields ────────────────────────────────────────────────────────────────

describe("offeringsFilterApi.fetchFields", () => {
  it("returns the array response unchanged and hits field-usage URL", async () => {
    const rows = [
      { field: { id: 1, name: "English", icon: "flag", iconPrefix: "fas" }, offerings: [1] },
    ];
    mockGet.mockResolvedValueOnce({ data: rows });
    const result = await offeringsFilterApi.fetchFields("en");
    expect(result).toBe(rows);
    expect(mockGet).toHaveBeenCalledWith(
      "/api/offerings/field-usage?status=draft&locale=en"
    );
  });

  it("returns [] when data is not an array", async () => {
    mockGet.mockResolvedValueOnce({ data: null });
    expect(await offeringsFilterApi.fetchFields("ar")).toEqual([]);
  });

  it("returns [] when the request rejects", async () => {
    mockGet.mockRejectedValueOnce(new Error("boom"));
    expect(await offeringsFilterApi.fetchFields("ar")).toEqual([]);
  });
});
