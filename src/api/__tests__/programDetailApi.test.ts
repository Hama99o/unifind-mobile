/**
 * programDetailApi.test.ts — unit tests for the Program Detail Strapi transport.
 *
 * http is globally mocked. Covers getBySlug (single fetch → data[0]/null) and
 * getRelated (study-field $in filter, exclude slug, empty-input short circuit,
 * Page mapping).
 */

import { programDetailApi } from "@/api/programDetailApi";
import { http } from "@/api/http";

const mockGet = http.get as jest.Mock;

function lastUrl(): string {
  const call = mockGet.mock.calls[mockGet.mock.calls.length - 1];
  return call[0] as string;
}
function lastParams(): URLSearchParams {
  return new URLSearchParams(lastUrl().split("?")[1] ?? "");
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getBySlug ──────────────────────────────────────────────────────────────────

describe("programDetailApi.getBySlug", () => {
  it("queries /api/programs with slug + locale + status + pageSize 1 and base populate", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
    await programDetailApi.getBySlug("cs-bachelor", "en");
    const p = lastParams();
    expect(lastUrl()).toContain("/api/programs?");
    expect(p.get("filters[locale][$eq]")).toBe("en");
    expect(p.get("filters[slug][$eq]")).toBe("cs-bachelor");
    expect(p.get("status")).toBe("draft");
    expect(p.get("pagination[page]")).toBe("1");
    expect(p.get("pagination[pageSize]")).toBe("1");
    // base populate present
    expect(p.get("populate[degree][fields][0]")).toBe("title");
    expect(p.get("fields[0]")).toBe("id");
  });

  it("returns data[0] when present", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 5, name: "CS" }, { id: 6 }] } });
    expect(await programDetailApi.getBySlug("cs", "en")).toEqual({ id: 5, name: "CS" });
  });

  it("returns null when there are no rows", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    expect(await programDetailApi.getBySlug("none", "en")).toBeNull();
  });

  it("returns null for an empty response shape", async () => {
    mockGet.mockResolvedValueOnce({});
    expect(await programDetailApi.getBySlug("none", "ar")).toBeNull();
  });
});

// ─── getRelated ─────────────────────────────────────────────────────────────────

describe("programDetailApi.getRelated", () => {
  it("short-circuits with an empty Page when no study field ids are given (no http call)", async () => {
    const result = await programDetailApi.getRelated([], "en", 1);
    expect(result).toEqual({ items: [], page: 1, pageCount: 1, total: 0 });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("appends study-field $in filters (stringified) and pagination", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [], meta: { pagination: { page: 2, pageCount: 3, total: 12 } } },
    });
    await programDetailApi.getRelated([11, 22], "en", 2, 8);
    const p = lastParams();
    expect(p.get("filters[specialisations][studyField][id][$in][0]")).toBe("11");
    expect(p.get("filters[specialisations][studyField][id][$in][1]")).toBe("22");
    expect(p.get("pagination[page]")).toBe("2");
    expect(p.get("pagination[pageSize]")).toBe("8");
  });

  it("uses default pageSize of 5 when not provided", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await programDetailApi.getRelated([1], "en", 1);
    expect(lastParams().get("pagination[pageSize]")).toBe("5");
  });

  it("adds a slug $ne exclusion when excludeSlug is supplied", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await programDetailApi.getRelated([1], "en", 1, 5, "current-prog");
    expect(lastParams().get("filters[slug][$ne]")).toBe("current-prog");
  });

  it("does NOT add a slug $ne when excludeSlug is omitted", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } });
    await programDetailApi.getRelated([1], "en", 1);
    expect(lastParams().get("filters[slug][$ne]")).toBeNull();
  });

  it("maps the response into a Page<ProgramListItem>", async () => {
    const rows = [{ id: 1, name: "Related", slug: "r" }];
    mockGet.mockResolvedValueOnce({
      data: { data: rows, meta: { pagination: { page: 1, pageCount: 2, total: 6 } } },
    });
    const result = await programDetailApi.getRelated([1, 2], "en", 1);
    expect(result).toEqual({ items: rows, page: 1, pageCount: 2, total: 6 });
  });

  it("falls back to empty items + default meta when meta is missing", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    const result = await programDetailApi.getRelated([1], "en", 1);
    expect(result).toEqual({ items: [], page: 1, pageCount: 1, total: 0 });
  });
});
