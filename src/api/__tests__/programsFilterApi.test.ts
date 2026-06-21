/**
 * programsFilterApi.test.ts — Strapi filter-source endpoints for Find Programs.
 *
 * `http` is globally mocked (jest.setup.ts). Each test feeds a strapi-shaped
 * response via mockResolvedValueOnce, then asserts (a) the URL/params passed to
 * http.get and (b) the mapped result shape.
 *
 * Coverage: fetchDegreeOptions, fetchFieldOptions, fetchDurationOptions
 * (sort + label building + every branch), fetchLanguageOptions,
 * fetchLocationOptions (unique map, multi-campus per city, back-compat field).
 */

import { http } from "@/api/http";
import { programsFilterApi } from "@/api/programsFilterApi";

const mockGet = http.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── fetchDegreeOptions ─────────────────────────────────────────────────────────

describe("programsFilterApi.fetchDegreeOptions", () => {
  it("maps degree rows to { label, value, count } and hits the right URL", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { degree: { id: 1, title: "Bachelor" }, count: 12 },
        { degree: { id: 2, title: "Master" }, count: 5 },
      ],
    });
    const result = await programsFilterApi.fetchDegreeOptions("en");
    expect(result).toEqual([
      { label: "Bachelor", value: "1", count: 12 },
      { label: "Master", value: "2", count: 5 },
    ]);
    expect(mockGet).toHaveBeenCalledWith(
      "/api/programs/distinct-degrees-programs?status=draft&locale=en"
    );
  });

  it("passes the ar locale through in the URL", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    await programsFilterApi.fetchDegreeOptions("ar");
    expect(mockGet).toHaveBeenCalledWith(
      "/api/programs/distinct-degrees-programs?status=draft&locale=ar"
    );
  });

  it("returns [] when data is an empty array", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    expect(await programsFilterApi.fetchDegreeOptions("en")).toEqual([]);
  });

  it("coerces the numeric degree id to a string value", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ degree: { id: 99, title: "PhD" }, count: 1 }],
    });
    const [opt] = await programsFilterApi.fetchDegreeOptions("en");
    expect(opt.value).toBe("99");
    expect(typeof opt.value).toBe("string");
  });
});

// ─── fetchFieldOptions ──────────────────────────────────────────────────────────

describe("programsFilterApi.fetchFieldOptions", () => {
  it("maps fieldOfStudy rows to { label, value, count }", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { fieldOfStudy: { id: 10, name: "Engineering" }, count: 7 },
        { fieldOfStudy: { id: 11, name: "Law" }, count: 3 },
      ],
    });
    const result = await programsFilterApi.fetchFieldOptions("en");
    expect(result).toEqual([
      { label: "Engineering", value: "10", count: 7 },
      { label: "Law", value: "11", count: 3 },
    ]);
    expect(mockGet).toHaveBeenCalledWith(
      "/api/programs/fields-program-ids?status=draft&locale=en"
    );
  });

  it("returns [] for an empty response", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    expect(await programsFilterApi.fetchFieldOptions("ar")).toEqual([]);
  });
});

// ─── fetchDurationOptions ───────────────────────────────────────────────────────

describe("programsFilterApi.fetchDurationOptions", () => {
  it("sorts by min ascending and uses the en-locked URL", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { min: 4, max: 4, count: 2 },
        { min: 1, max: 2, count: 9 },
      ],
    });
    const result = await programsFilterApi.fetchDurationOptions();
    // sorted: min 1 first
    expect(result[0].value).toBe("1 - 2");
    expect(result[1].value).toBe("4 - 4");
    expect(mockGet).toHaveBeenCalledWith(
      "/api/programs/durations?status=draft&locale=en"
    );
  });

  it("labels a single-year (min === max === 1) as '1 Year' (singular)", async () => {
    mockGet.mockResolvedValueOnce({ data: [{ min: 1, max: 1, count: 4 }] });
    const [opt] = await programsFilterApi.fetchDurationOptions();
    expect(opt.label).toBe("1 Year");
    expect(opt.value).toBe("1 - 1");
    expect(opt.count).toBe(4);
  });

  it("labels min === max > 1 as plural 'N Years'", async () => {
    mockGet.mockResolvedValueOnce({ data: [{ min: 3, max: 3, count: 1 }] });
    const [opt] = await programsFilterApi.fetchDurationOptions();
    expect(opt.label).toBe("3 Years");
  });

  it("labels a range as 'min - max Years'", async () => {
    mockGet.mockResolvedValueOnce({ data: [{ min: 2, max: 5, count: 1 }] });
    const [opt] = await programsFilterApi.fetchDurationOptions();
    expect(opt.label).toBe("2 - 5 Years");
  });

  it("labels min-only (max falsy) as 'min Years'", async () => {
    mockGet.mockResolvedValueOnce({ data: [{ min: 6, max: 0, count: 1 }] });
    const [opt] = await programsFilterApi.fetchDurationOptions();
    expect(opt.label).toBe("6 Years");
    expect(opt.value).toBe("6 - 0");
  });

  it("labels max-only (min falsy) as 'max Years'", async () => {
    mockGet.mockResolvedValueOnce({ data: [{ min: 0, max: 7, count: 1 }] });
    const [opt] = await programsFilterApi.fetchDurationOptions();
    expect(opt.label).toBe("7 Years");
  });

  it("labels both falsy (0/0) as '0 Years'", async () => {
    mockGet.mockResolvedValueOnce({ data: [{ min: 0, max: 0, count: 1 }] });
    const [opt] = await programsFilterApi.fetchDurationOptions();
    expect(opt.label).toBe("0 Years");
    expect(opt.value).toBe("0 - 0");
  });

  it("returns [] for an empty response", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    expect(await programsFilterApi.fetchDurationOptions()).toEqual([]);
  });
});

// ─── fetchLanguageOptions ───────────────────────────────────────────────────────

describe("programsFilterApi.fetchLanguageOptions", () => {
  it("maps language rows to { label, value, count }", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { language: { id: 1, language: "English" }, count: 20 },
        { language: { id: 2, language: "Arabic" }, count: 8 },
      ],
    });
    const result = await programsFilterApi.fetchLanguageOptions("en");
    expect(result).toEqual([
      { label: "English", value: "1", count: 20 },
      { label: "Arabic", value: "2", count: 8 },
    ]);
    expect(mockGet).toHaveBeenCalledWith(
      "/api/programs/language-usage?status=draft&locale=en"
    );
  });

  it("returns [] for an empty response", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    expect(await programsFilterApi.fetchLanguageOptions("ar")).toEqual([]);
  });
});

// ─── fetchLocationOptions ───────────────────────────────────────────────────────

describe("programsFilterApi.fetchLocationOptions", () => {
  it("builds the populate query with status=draft and locale filter", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await programsFilterApi.fetchLocationOptions("en");
    const url: string = mockGet.mock.calls[0][0];
    expect(url.startsWith("/api/programs?")).toBe(true);
    // URLSearchParams encodes the bracketed filter keys
    expect(decodeURIComponent(url)).toContain("filters[locale][$eq]=en");
    expect(url).toContain("status=draft");
    expect(decodeURIComponent(url)).toContain("pagination[pageSize]=500");
    expect(decodeURIComponent(url)).toContain("populate[campus][fields][0]=name");
  });

  it("returns [] when there are no programs", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    expect(await programsFilterApi.fetchLocationOptions("en")).toEqual([]);
  });

  it("maps a single campus city to one location with value 'gov,city'", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            campus: [
              {
                location: {
                  id: 50,
                  city: { name: "Beirut" },
                  district: { governorate: "Beirut Gov" },
                },
              },
            ],
          },
        ],
      },
    });
    const result = await programsFilterApi.fetchLocationOptions("en");
    expect(result).toEqual([
      {
        label: "Beirut",
        gov: "Beirut Gov",
        value: "Beirut Gov,Beirut",
        locationIds: ["50"],
        locationId: "50",
      },
    ]);
  });

  it("dedupes by gov,city while collecting all distinct location ids", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            campus: [
              { location: { id: 1, city: { name: "Tripoli" }, district: { governorate: "North" } } },
              { location: { id: 2, city: { name: "Tripoli" }, district: { governorate: "North" } } },
            ],
          },
          {
            campus: [
              { location: { id: 1, city: { name: "Tripoli" }, district: { governorate: "North" } } },
            ],
          },
        ],
      },
    });
    const result = await programsFilterApi.fetchLocationOptions("en");
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe("North,Tripoli");
    // ids 1 and 2 collected once each (Set), order of first insertion
    expect(result[0].locationIds.sort()).toEqual(["1", "2"]);
    expect(result[0].locationId).toBe("1"); // back-compat = first id
  });

  it("skips campuses with no city name or no location id", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            campus: [
              { location: { id: 9, city: { name: "" }, district: { governorate: "G" } } }, // no city → skip
              { location: { city: { name: "Sidon" }, district: { governorate: "South" } } }, // no id → skip
              { location: { id: 10, city: { name: "Zahle" }, district: { governorate: "Bekaa" } } }, // kept
            ],
          },
        ],
      },
    });
    const result = await programsFilterApi.fetchLocationOptions("en");
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Zahle");
  });

  it("treats a missing governorate as empty string in the value key", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          { campus: [{ location: { id: 3, city: { name: "Byblos" } } }] },
        ],
      },
    });
    const result = await programsFilterApi.fetchLocationOptions("en");
    expect(result[0].gov).toBe("");
    expect(result[0].value).toBe(",Byblos");
  });

  it("handles a program with no campus array gracefully", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{}] } });
    expect(await programsFilterApi.fetchLocationOptions("en")).toEqual([]);
  });
});
