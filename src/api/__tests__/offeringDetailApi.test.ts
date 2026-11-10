/**
 * offeringDetailApi.test.ts — unit tests for the single-offering Strapi transport.
 *
 * http is globally mocked. Covers query building, data[0]/null mapping, and the
 * try/catch fallback to null.
 */

import { offeringDetailApi } from "@/api/offeringDetailApi";
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

describe("offeringDetailApi.getBySlug", () => {
  it("queries /api/offerings filtered by slug + status with detail populate", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 1, title: "T", slug: "t" }] } });
    await offeringDetailApi.getBySlug("python-101");
    const p = lastParams();
    expect(lastUrl()).toContain("/api/offerings?");
    expect(p.get("filters[slug][$eq]")).toBe("python-101");
    expect(p.get("status")).toBe("draft");
    expect(p.get("fields[0]")).toBe("id");
    expect(p.get("populate[category][fields][0]")).toBe("name");
    expect(p.get("populate[degreeLevel][fields][0]")).toBe("title");
    expect(p.get("populate[location][populate][city][fields][0]")).toBe("name");
    expect(p.get("populate[tags][fields][0]")).toBe("name");
  });

  it("returns the first item", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 1, title: "First" }, { id: 2 }] } });
    expect(await offeringDetailApi.getBySlug("x")).toEqual({ id: 1, title: "First" });
  });

  it("returns null when there are no rows", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    expect(await offeringDetailApi.getBySlug("none")).toBeNull();
  });

  it("returns null for an empty response shape", async () => {
    mockGet.mockResolvedValueOnce({});
    expect(await offeringDetailApi.getBySlug("none")).toBeNull();
  });

  it("returns null when the request throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("network"));
    expect(await offeringDetailApi.getBySlug("none")).toBeNull();
  });

  // QA 2026-11-10 BUG-03: AR content lives in a separate Strapi entry (same documentId).
  it("ar: returns the AR translation with the EN id and slug", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { data: [{ id: 4, documentId: "docA", slug: "cyber", title: "Cyber" }] } })
      .mockResolvedValueOnce({ data: { data: [{ id: 8, documentId: "docA", slug: "cyber-ar", title: "أمان" }] } });
    const r = await offeringDetailApi.getBySlug("cyber", "ar");
    expect(r).toEqual({ id: 4, documentId: "docA", slug: "cyber", title: "أمان" });
    const qs = new URLSearchParams(mockGet.mock.calls[1][0].split("?")[1]);
    expect(qs.get("filters[documentId][$eq]")).toBe("docA");
    expect(qs.get("filters[locale][$eq]")).toBe("ar");
  });

  it("ar: falls back to EN when there is no translation or the AR call fails", async () => {
    const en = { id: 9, documentId: "docB", slug: "guide", title: "Guide" };
    mockGet.mockResolvedValueOnce({ data: { data: [en] } }).mockResolvedValueOnce({ data: { data: [] } });
    expect(await offeringDetailApi.getBySlug("guide", "ar")).toEqual(en);
    mockGet.mockResolvedValueOnce({ data: { data: [en] } }).mockRejectedValueOnce(new Error("net"));
    expect(await offeringDetailApi.getBySlug("guide", "ar")).toEqual(en);
  });

  it("en: single request, no translation lookup", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 1, documentId: "d", slug: "s" }] } });
    await offeringDetailApi.getBySlug("s", "en");
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
