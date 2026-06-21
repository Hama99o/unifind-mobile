/**
 * institutionsApi.test.ts — unit tests for the Strapi Find-Institutions transport.
 *
 * http is globally mocked (jest.setup.ts). We feed strapi-shaped responses via
 * mockResolvedValueOnce and assert (a) the request params/URL and (b) the
 * transformed output.
 *
 * Each call goes through `http.get(url)` with a single string argument, so we
 * parse the query string from that argument into a URLSearchParams for
 * order-independent assertions.
 */

import { institutionsApi } from "@/api/institutionsApi";
import { http } from "@/api/http";

const mockGet = http.get as jest.Mock;

/** Pull the query-string params out of the URL passed to the latest http.get call. */
function lastUrl(): string {
  const call = mockGet.mock.calls[mockGet.mock.calls.length - 1];
  return call[0] as string;
}
function lastParams(): URLSearchParams {
  const url = lastUrl();
  const qs = url.split("?")[1] ?? "";
  return new URLSearchParams(qs);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── list() ───────────────────────────────────────────────────────────────────

describe("institutionsApi.list", () => {
  it("hits /api/instituitions (intentional Strapi typo) with locale + default sort", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });

    await institutionsApi.list({ locale: "en", page: 1 });

    expect(lastUrl()).toContain("/api/instituitions?");
    const p = lastParams();
    expect(p.get("filters[locale][$eq]")).toBe("en");
    // default sort branch: order:asc + secondary name:asc
    expect(p.get("sort[0]")).toBe("order:asc");
    expect(p.get("sort[1]")).toBe("name:asc");
    // default pageSize is 6
    expect(p.get("pagination[page]")).toBe("1");
    expect(p.get("pagination[pageSize]")).toBe("6");
    expect(p.get("status")).toBe("draft");
  });

  it("appends all top-level fields in order", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await institutionsApi.list({ locale: "en", page: 1 });
    const p = lastParams();
    expect(p.get("fields[0]")).toBe("id");
    expect(p.get("fields[1]")).toBe("documentId");
    expect(p.get("fields[2]")).toBe("acronym");
    expect(p.get("fields[3]")).toBe("name");
    expect(p.get("fields[11]")).toBe("order");
  });

  it("emits nested populate keys (logo, tuition.degree, mainLocation.city)", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await institutionsApi.list({ locale: "en", page: 1 });
    const p = lastParams();
    expect(p.get("populate[logo][fields][0]")).toBe("url");
    expect(p.get("populate[tuition][fields][0]")).toBe("minTuition");
    expect(p.get("populate[tuition][populate][degree][fields][0]")).toBe("title");
    expect(p.get("populate[mainLocation][populate][city][fields][0]")).toBe("name");
    expect(p.get("populate[ranking][populate][organizations][fields][0]")).toBe("rankingCategory");
  });

  it("builds the $or search across name/acronym/about/institutionInfo.info when search is set", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await institutionsApi.list({ locale: "en", page: 1, search: "  beirut  " });
    const p = lastParams();
    // trimmed
    expect(p.get("filters[$or][0][name][$containsi]")).toBe("beirut");
    expect(p.get("filters[$or][1][acronym][$containsi]")).toBe("beirut");
    expect(p.get("filters[$or][2][about][$containsi]")).toBe("beirut");
    expect(p.get("filters[$or][3][institutionInfo][info][$containsi]")).toBe("beirut");
  });

  it("omits search filters when search is empty/whitespace", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await institutionsApi.list({ locale: "en", page: 1, search: "   " });
    const p = lastParams();
    expect(p.get("filters[$or][0][name][$containsi]")).toBeNull();
  });

  it("appends id-in filters for each idIn entry", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await institutionsApi.list({ locale: "en", page: 1, idIn: ["10", "20", "30"] });
    const p = lastParams();
    expect(p.get("filters[id][$in][0]")).toBe("10");
    expect(p.get("filters[id][$in][1]")).toBe("20");
    expect(p.get("filters[id][$in][2]")).toBe("30");
  });

  it("does not append id filters for empty idIn array", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await institutionsApi.list({ locale: "en", page: 1, idIn: [] });
    expect(lastParams().get("filters[id][$in][0]")).toBeNull();
  });

  it("applies tuition min/max gte/lte filters when provided", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await institutionsApi.list({ locale: "en", page: 1, tuitionMin: 1000, tuitionMax: 5000 });
    const p = lastParams();
    expect(p.get("filters[tuition][minTuition][$gte]")).toBe("1000");
    expect(p.get("filters[tuition][maxTuition][$lte]")).toBe("5000");
  });

  it("skips tuition filters when min/max are null", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await institutionsApi.list({ locale: "en", page: 1, tuitionMin: null, tuitionMax: null });
    const p = lastParams();
    expect(p.get("filters[tuition][minTuition][$gte]")).toBeNull();
    expect(p.get("filters[tuition][maxTuition][$lte]")).toBeNull();
  });

  it("skips tuition filters when min/max are NaN", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await institutionsApi.list({ locale: "en", page: 1, tuitionMin: NaN, tuitionMax: NaN });
    const p = lastParams();
    expect(p.get("filters[tuition][minTuition][$gte]")).toBeNull();
    expect(p.get("filters[tuition][maxTuition][$lte]")).toBeNull();
  });

  it("uses tuition.minTuition:asc for sort=tuition_asc (no secondary sort)", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await institutionsApi.list({ locale: "en", page: 1, sort: "tuition_asc" });
    const p = lastParams();
    expect(p.get("sort[0]")).toBe("tuition.minTuition:asc");
    expect(p.get("sort[1]")).toBeNull();
  });

  it("uses tuition.maxTuition:desc for sort=tuition_desc", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await institutionsApi.list({ locale: "en", page: 1, sort: "tuition_desc" });
    expect(lastParams().get("sort[0]")).toBe("tuition.maxTuition:desc");
  });

  it("honors a custom pageSize and page number", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 3, pageCount: 1, total: 0 } } } });
    await institutionsApi.list({ locale: "ar", page: 3, pageSize: 12 });
    const p = lastParams();
    expect(p.get("filters[locale][$eq]")).toBe("ar");
    expect(p.get("pagination[page]")).toBe("3");
    expect(p.get("pagination[pageSize]")).toBe("12");
  });

  it("maps the strapi response into a Page<InstitutionListItem>", async () => {
    const rows = [{ id: 1, name: "AUB" }, { id: 2, name: "LAU" }];
    mockGet.mockResolvedValueOnce({
      data: { data: rows, meta: { pagination: { page: 2, pageCount: 5, total: 28 } } },
    });
    const result = await institutionsApi.list({ locale: "en", page: 2 });
    expect(result).toEqual({ items: rows, page: 2, pageCount: 5, total: 28 });
  });

  it("falls back to empty items + default meta when response is empty", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    const result = await institutionsApi.list({ locale: "en", page: 1 });
    expect(result).toEqual({ items: [], page: 1, pageCount: 1, total: 0 });
  });
});

// ─── fetchDegreeFilterOptions ───────────────────────────────────────────────────

describe("institutionsApi.fetchDegreeFilterOptions", () => {
  it("calls /api/programs/distinct-degrees with status+locale and returns the array", async () => {
    const rows = [{ degree: { title: "Bachelors" }, institutions: "1,2", count: 2 }];
    mockGet.mockResolvedValueOnce({ data: rows });
    const result = await institutionsApi.fetchDegreeFilterOptions("en");
    expect(lastUrl()).toBe("/api/programs/distinct-degrees?status=draft&locale=en");
    expect(result).toBe(rows);
  });

  it("returns [] when the response data is missing", async () => {
    mockGet.mockResolvedValueOnce({});
    const result = await institutionsApi.fetchDegreeFilterOptions("ar");
    expect(result).toEqual([]);
    expect(lastUrl()).toContain("locale=ar");
  });
});

// ─── fetchFieldFilterOptions ────────────────────────────────────────────────────

describe("institutionsApi.fetchFieldFilterOptions", () => {
  it("calls /api/programs/fields-institution-ids and returns the array", async () => {
    const rows = [{ fieldOfStudy: { name: "Engineering" }, institutions: "3,4", count: 2 }];
    mockGet.mockResolvedValueOnce({ data: rows });
    const result = await institutionsApi.fetchFieldFilterOptions("en");
    expect(lastUrl()).toBe("/api/programs/fields-institution-ids?status=draft&locale=en");
    expect(result).toBe(rows);
  });

  it("returns [] when the response data is missing", async () => {
    mockGet.mockResolvedValueOnce({});
    expect(await institutionsApi.fetchFieldFilterOptions("en")).toEqual([]);
  });
});

// ─── fetchTuitionFilterOptions ──────────────────────────────────────────────────

describe("institutionsApi.fetchTuitionFilterOptions", () => {
  it("queries /api/instituitions with tuition-only fields and pageSize 200", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await institutionsApi.fetchTuitionFilterOptions("en");
    const p = lastParams();
    expect(lastUrl()).toContain("/api/instituitions?");
    expect(p.get("filters[locale][$eq]")).toBe("en");
    expect(p.get("fields[0]")).toBe("id");
    expect(p.get("populate[tuition][fields][0]")).toBe("minTuition");
    expect(p.get("populate[tuition][fields][1]")).toBe("maxTuition");
    expect(p.get("pagination[pageSize]")).toBe("200");
    expect(p.get("status")).toBe("draft");
  });

  it("builds a 'min - max' bucket per institution and counts duplicates", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          { tuition: [{ minTuition: 1000, maxTuition: 2000 }] },
          { tuition: [{ minTuition: 1000, maxTuition: 2000 }] }, // same bucket → count 2
          { tuition: [{ minTuition: 500, maxTuition: 800 }] },
        ],
      },
    });
    const opts = await institutionsApi.fetchTuitionFilterOptions("en");
    // sorted ascending by min: 500-800 first, then 1000-2000
    expect(opts).toEqual([
      { label: "500 - 800 $", value: "500 - 800", count: 1 },
      { label: "1000 - 2000 $", value: "1000 - 2000", count: 2 },
    ]);
  });

  it("uses min(mins) and max(maxes) across multiple tuition entries on one institution", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ tuition: [{ minTuition: 3000, maxTuition: 4000 }, { minTuition: 1000, maxTuition: 9000 }] }] },
    });
    const opts = await institutionsApi.fetchTuitionFilterOptions("en");
    expect(opts).toEqual([{ label: "1000 - 9000 $", value: "1000 - 9000", count: 1 }]);
  });

  it("skips institutions with no usable min/max tuition values", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          { tuition: [] },
          { tuition: [{ minTuition: undefined, maxTuition: undefined }] },
          { /* no tuition key */ },
        ],
      },
    });
    const opts = await institutionsApi.fetchTuitionFilterOptions("en");
    expect(opts).toEqual([]);
  });

  it("returns [] when the response has no data", async () => {
    mockGet.mockResolvedValueOnce({});
    expect(await institutionsApi.fetchTuitionFilterOptions("en")).toEqual([]);
  });
});

// ─── fetchLocationFilterOptions ─────────────────────────────────────────────────

describe("institutionsApi.fetchLocationFilterOptions", () => {
  it("calls /api/campuses with the locale + populate query string", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await institutionsApi.fetchLocationFilterOptions("en");
    const url = lastUrl();
    expect(url).toContain("/api/campuses?");
    expect(url).toContain("locale=en");
    expect(url).toContain("pagination[pageSize]=400");
  });

  it("dedupes by gov,city key and maps to { label, gov, value, institutionId }", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          { location: { city: { name: "Beirut" }, district: { governorate: "Beirut Gov" } }, instituition: { id: 5 } },
          // duplicate key gov,city → ignored
          { location: { city: { name: "Beirut" }, district: { governorate: "Beirut Gov" } }, instituition: { id: 6 } },
          { location: { city: { name: "Tripoli" }, district: { governorate: "North" } }, instituition: { id: 7 } },
        ],
      },
    });
    const result = await institutionsApi.fetchLocationFilterOptions("en");
    expect(result).toEqual([
      { label: "Beirut", gov: "Beirut Gov", value: "Beirut Gov,Beirut", institutionId: "5" },
      { label: "Tripoli", gov: "North", value: "North,Tripoli", institutionId: "7" },
    ]);
  });

  it("skips campuses with no city name", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ location: { district: { governorate: "X" } }, instituition: { id: 1 } }] },
    });
    expect(await institutionsApi.fetchLocationFilterOptions("en")).toEqual([]);
  });

  it("defaults missing gov + institutionId to empty strings", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ location: { city: { name: "Saida" } } }] },
    });
    const result = await institutionsApi.fetchLocationFilterOptions("en");
    expect(result).toEqual([
      { label: "Saida", gov: "", value: ",Saida", institutionId: "" },
    ]);
  });

  it("returns [] when the response has no data", async () => {
    mockGet.mockResolvedValueOnce({});
    expect(await institutionsApi.fetchLocationFilterOptions("en")).toEqual([]);
  });
});
