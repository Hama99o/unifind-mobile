/**
 * catalogItemsApi.test.ts — Strapi reads for Programs/Institutions/Offerings
 * used by Favorites (documentId / id lists) and Comparisons (numeric id lists).
 *
 * `http` is globally mocked. Tests assert (a) the URL/filter/populate args and
 * (b) the returned data.data passthrough, plus the empty-input short-circuit
 * (no network call) and the extractDescription delegation.
 *
 * Coverage: getProgramsByDocumentIds, getProgramsByIds,
 * getInstitutionsByDocumentIds, getInstitutionsByIds, getOfferingsByIds,
 * extractDescription.
 */

import { http } from "@/api/http";
import { catalogItemsApi } from "@/api/catalogItemsApi";

const mockGet = http.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getProgramsByDocumentIds ───────────────────────────────────────────────────

describe("catalogItemsApi.getProgramsByDocumentIds", () => {
  it("short-circuits to [] without calling http when the list is empty", async () => {
    const result = await catalogItemsApi.getProgramsByDocumentIds([], "en");
    expect(result).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("returns res.data.data for a non-empty documentId list", async () => {
    const rows = [{ id: 1, documentId: "p-1", name: "CS", slug: "cs" }];
    mockGet.mockResolvedValueOnce({ data: { data: rows } });
    const result = await catalogItemsApi.getProgramsByDocumentIds(["p-1"], "en");
    expect(result).toBe(rows);
  });

  it("builds a documentId $in filter, program populate, locale + pageSize 50", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await catalogItemsApi.getProgramsByDocumentIds(["p-1", "p-2"], "en");
    const url: string = mockGet.mock.calls[0][0];
    expect(url.startsWith("/api/programs?")).toBe(true);
    expect(url).toContain("filters[documentId][$in][0]=p-1");
    expect(url).toContain("filters[documentId][$in][1]=p-2");
    expect(url).toContain("populate[degree][fields][0]=title");
    // nbOfYears/nbOfCredits are components — must be populated, never requested
    // as scalar fields (that 400s the query and broke compare/favorites).
    expect(url).toContain("populate[nbOfYears][fields][0]=min");
    expect(url).toContain("populate[nbOfCredits][fields][0]=min");
    expect(url).not.toContain("=nbOfYears");
    expect(url).not.toContain("=nbOfCredits");
    expect(url).toContain("filters[locale][$eq]=en");
    expect(url).toContain("pagination[pageSize]=50");
    expect(url).toContain("status=draft");
  });

  it("url-encodes documentIds containing special characters", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await catalogItemsApi.getProgramsByDocumentIds(["a b&c"], "en");
    const url: string = mockGet.mock.calls[0][0];
    expect(url).toContain("filters[documentId][$in][0]=a%20b%26c");
  });

  it("returns [] when res.data.data is missing", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    expect(await catalogItemsApi.getProgramsByDocumentIds(["p-1"], "en")).toEqual([]);
  });
});

// ─── getProgramsByIds ───────────────────────────────────────────────────────────

describe("catalogItemsApi.getProgramsByIds", () => {
  it("short-circuits to [] for an empty id list", async () => {
    expect(await catalogItemsApi.getProgramsByIds([], "en")).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("builds a numeric id $in filter (not documentId)", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await catalogItemsApi.getProgramsByIds(["10", "11"], "ar");
    const url: string = mockGet.mock.calls[0][0];
    expect(url).toContain("filters[id][$in][0]=10");
    expect(url).toContain("filters[id][$in][1]=11");
    expect(url).not.toContain("filters[documentId]");
    expect(url).toContain("filters[locale][$eq]=ar");
  });

  it("passes through res.data.data", async () => {
    const rows = [{ id: 10, documentId: "p-10", name: "Law", slug: "law" }];
    mockGet.mockResolvedValueOnce({ data: { data: rows } });
    expect(await catalogItemsApi.getProgramsByIds(["10"], "en")).toBe(rows);
  });
});

// ─── getInstitutionsByDocumentIds ───────────────────────────────────────────────

describe("catalogItemsApi.getInstitutionsByDocumentIds", () => {
  it("short-circuits to [] for an empty list", async () => {
    expect(await catalogItemsApi.getInstitutionsByDocumentIds([], "en")).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("targets the misspelled /api/instituitions endpoint with documentId filter + institution populate", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await catalogItemsApi.getInstitutionsByDocumentIds(["i-1"], "en");
    const url: string = mockGet.mock.calls[0][0];
    expect(url.startsWith("/api/instituitions?")).toBe(true);
    expect(url).toContain("filters[documentId][$in][0]=i-1");
    expect(url).toContain("populate[ranking][fields][0]=position");
    // institution has no scalar `type` field, and ranking has no `name` field —
    // requesting either 400s the query (broke the institutions compare tab).
    // (institutionInfo's component `type` populate is fine — guard the bad ones.)
    expect(url).not.toMatch(/fields\[\d+\]=type(&|$)/);
    expect(url).not.toContain("populate[ranking][fields][1]=name");
    expect(url).toContain("pagination[pageSize]=50");
  });

  it("passes through res.data.data", async () => {
    const rows = [{ id: 1, documentId: "i-1", name: "AUB", slug: "aub" }];
    mockGet.mockResolvedValueOnce({ data: { data: rows } });
    expect(await catalogItemsApi.getInstitutionsByDocumentIds(["i-1"], "en")).toBe(rows);
  });
});

// ─── getInstitutionsByIds ───────────────────────────────────────────────────────

describe("catalogItemsApi.getInstitutionsByIds", () => {
  it("short-circuits to [] for an empty list", async () => {
    expect(await catalogItemsApi.getInstitutionsByIds([], "en")).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("builds a numeric id $in filter against /api/instituitions", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await catalogItemsApi.getInstitutionsByIds(["3", "4"], "en");
    const url: string = mockGet.mock.calls[0][0];
    expect(url.startsWith("/api/instituitions?")).toBe(true);
    expect(url).toContain("filters[id][$in][0]=3");
    expect(url).toContain("filters[id][$in][1]=4");
    expect(url).not.toContain("filters[documentId]");
  });

  it("returns [] when res.data.data is missing", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    expect(await catalogItemsApi.getInstitutionsByIds(["3"], "en")).toEqual([]);
  });
});

// ─── getOfferingsByIds ──────────────────────────────────────────────────────────

describe("catalogItemsApi.getOfferingsByIds", () => {
  it("short-circuits to [] for an empty list", async () => {
    expect(await catalogItemsApi.getOfferingsByIds([], "en")).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("builds a numeric id $in filter against /api/offerings with offering populate", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await catalogItemsApi.getOfferingsByIds(["7"], "ar");
    const url: string = mockGet.mock.calls[0][0];
    expect(url.startsWith("/api/offerings?")).toBe(true);
    expect(url).toContain("filters[id][$in][0]=7");
    expect(url).toContain("populate[image][fields][0]=url");
    expect(url).toContain("fields[5]=availableOnline");
    // price/duration are Node-side, not Strapi scalar fields — must not be requested.
    expect(url).not.toContain("=price");
    expect(url).not.toContain("=duration");
    expect(url).toContain("filters[locale][$eq]=ar");
    expect(url).toContain("pagination[pageSize]=50");
  });

  it("passes through res.data.data", async () => {
    const rows = [{ id: 7, documentId: "o-7", title: "IELTS", slug: "ielts" }];
    mockGet.mockResolvedValueOnce({ data: { data: rows } });
    expect(await catalogItemsApi.getOfferingsByIds(["7"], "en")).toBe(rows);
  });
});

// ─── extractDescription ─────────────────────────────────────────────────────────

describe("catalogItemsApi.extractDescription", () => {
  it("delegates to extractPlainText (joins paragraph text)", () => {
    const blocks = [{ type: "paragraph", children: [{ text: "Hi" }, { text: "there" }] }];
    expect(catalogItemsApi.extractDescription(blocks)).toBe("Hi there");
  });

  it("returns '' for null / non-array input", () => {
    expect(catalogItemsApi.extractDescription(null)).toBe("");
    expect(catalogItemsApi.extractDescription(undefined)).toBe("");
  });
});
