/**
 * programExplorerApi.test.ts — Strapi endpoints for the Program Explorer hub.
 *
 * `http` is globally mocked. Both methods return res.data when it is an array,
 * otherwise []; and swallow rejections, returning [].
 *
 * Coverage: fetchFieldOptionsWithIcons + fetchDegreeOptions — happy path
 * (URL + passthrough), non-array guard, rejection → [], locale passthrough.
 */

import { http } from "@/api/http";
import { programExplorerApi } from "@/api/programExplorerApi";

const mockGet = http.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── fetchFieldOptionsWithIcons ─────────────────────────────────────────────────

describe("programExplorerApi.fetchFieldOptionsWithIcons", () => {
  it("returns the array response unchanged and hits fields-program-icons URL", async () => {
    const rows = [
      {
        fieldOfStudy: { id: 1, name: "Engineering", icon: "gear", iconPrefix: "fas" },
        count: 12,
      },
    ];
    mockGet.mockResolvedValueOnce({ data: rows });
    const result = await programExplorerApi.fetchFieldOptionsWithIcons("en");
    expect(result).toBe(rows);
    expect(mockGet).toHaveBeenCalledWith(
      "/api/programs/fields-program-icons?status=draft&locale=en"
    );
  });

  it("passes the ar locale through", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    await programExplorerApi.fetchFieldOptionsWithIcons("ar");
    expect(mockGet).toHaveBeenCalledWith(
      "/api/programs/fields-program-icons?status=draft&locale=ar"
    );
  });

  it("returns [] when data is not an array", async () => {
    mockGet.mockResolvedValueOnce({ data: { unexpected: true } });
    expect(await programExplorerApi.fetchFieldOptionsWithIcons("en")).toEqual([]);
  });

  it("returns [] when the request rejects (catch branch)", async () => {
    mockGet.mockRejectedValueOnce(new Error("network down"));
    expect(await programExplorerApi.fetchFieldOptionsWithIcons("en")).toEqual([]);
  });
});

// ─── fetchDegreeOptions ─────────────────────────────────────────────────────────

describe("programExplorerApi.fetchDegreeOptions", () => {
  it("returns the array response unchanged and hits distinct-degrees-programs URL", async () => {
    const rows = [{ degree: { id: 1, title: "Bachelor" }, count: 30 }];
    mockGet.mockResolvedValueOnce({ data: rows });
    const result = await programExplorerApi.fetchDegreeOptions("en");
    expect(result).toBe(rows);
    expect(mockGet).toHaveBeenCalledWith(
      "/api/programs/distinct-degrees-programs?status=draft&locale=en"
    );
  });

  it("returns [] when data is not an array", async () => {
    mockGet.mockResolvedValueOnce({ data: null });
    expect(await programExplorerApi.fetchDegreeOptions("ar")).toEqual([]);
  });

  it("returns [] when the request rejects", async () => {
    mockGet.mockRejectedValueOnce(new Error("boom"));
    expect(await programExplorerApi.fetchDegreeOptions("ar")).toEqual([]);
  });
});
