/**
 * catalog.say.test.ts — unit tests for the testimonial-join Strapi fetch helpers.
 *
 * http is globally mocked. Covers the empty-input short circuit (no http call),
 * documentId/id $in filter building, the populate query, and the mapping with
 * "" fallbacks for missing nested url/name fields.
 */

import {
  fetchInstitutionsByDocumentIds,
  fetchProgramsByDocumentIds,
  fetchOfferingsByIds,
} from "@/api/catalog.say";
import { http } from "@/api/http";

const mockGet = http.get as jest.Mock;

function lastUrl(): string {
  return mockGet.mock.calls[mockGet.mock.calls.length - 1][0] as string;
}
function lastParams(): URLSearchParams {
  return new URLSearchParams(lastUrl().split("?")[1] ?? "");
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── fetchInstitutionsByDocumentIds ─────────────────────────────────────────────

describe("fetchInstitutionsByDocumentIds", () => {
  it("returns [] without calling http when documentIds is empty", async () => {
    const result = await fetchInstitutionsByDocumentIds("en", []);
    expect(result).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("queries /api/instituitions with locale, populate and documentId $in filters", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await fetchInstitutionsByDocumentIds("en", ["doc1", "doc2"]);
    const p = lastParams();
    expect(lastUrl()).toContain("/api/instituitions?");
    expect(p.get("filters[locale][$eq]")).toBe("en");
    expect(p.get("populate[logo][fields][0]")).toBe("url");
    expect(p.get("populate[photoCover][fields][0]")).toBe("url");
    expect(p.get("status")).toBe("draft");
    expect(p.get("filters[documentId][$in][0]")).toBe("doc1");
    expect(p.get("filters[documentId][$in][1]")).toBe("doc2");
  });

  it("maps rows to InstitutionSayItem, defaulting missing fields to ''", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          { id: 1, documentId: "d1", name: "AUB", slug: "aub", logo: { url: "logo.png" }, photoCover: { url: "cover.png" } },
          { id: 2, documentId: "d2" }, // missing name/slug/logo/photoCover
        ],
      },
    });
    const result = await fetchInstitutionsByDocumentIds("en", ["d1", "d2"]);
    expect(result).toEqual([
      { id: 1, documentId: "d1", name: "AUB", slug: "aub", photoCoverUrl: "cover.png", logoUrl: "logo.png" },
      { id: 2, documentId: "d2", name: "", slug: "", photoCoverUrl: "", logoUrl: "" },
    ]);
  });

  it("returns [] when the response has no data", async () => {
    mockGet.mockResolvedValueOnce({});
    expect(await fetchInstitutionsByDocumentIds("en", ["d1"])).toEqual([]);
  });
});

// ─── fetchProgramsByDocumentIds ─────────────────────────────────────────────────

describe("fetchProgramsByDocumentIds", () => {
  it("returns [] without calling http when documentIds is empty", async () => {
    expect(await fetchProgramsByDocumentIds("en", [])).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("queries /api/programs with documentId $in filters and maps documentId/name", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ documentId: "p1", name: "CS" }, { documentId: "p2" }] } });
    const result = await fetchProgramsByDocumentIds("ar", ["p1", "p2"]);
    const p = lastParams();
    expect(lastUrl()).toContain("/api/programs?");
    expect(p.get("filters[locale][$eq]")).toBe("ar");
    expect(p.get("filters[documentId][$in][0]")).toBe("p1");
    expect(p.get("filters[documentId][$in][1]")).toBe("p2");
    expect(result).toEqual([
      { documentId: "p1", name: "CS" },
      { documentId: "p2", name: "" },
    ]);
  });

  it("returns [] when the response has no data", async () => {
    mockGet.mockResolvedValueOnce({});
    expect(await fetchProgramsByDocumentIds("en", ["p1"])).toEqual([]);
  });
});

// ─── fetchOfferingsByIds ────────────────────────────────────────────────────────

describe("fetchOfferingsByIds", () => {
  it("returns [] without calling http when ids is empty", async () => {
    expect(await fetchOfferingsByIds("en", [])).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("queries /api/offerings with id $in filters, image populate, and maps fields", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          { id: 1, documentId: "o1", title: "IELTS", slug: "ielts", image: { url: "img.png" } },
          { id: 2, documentId: "o2" }, // missing title/slug/image
        ],
      },
    });
    const result = await fetchOfferingsByIds("en", ["1", "2"]);
    const p = lastParams();
    expect(lastUrl()).toContain("/api/offerings?");
    expect(p.get("populate[image][fields][0]")).toBe("url");
    expect(p.get("filters[id][$in][0]")).toBe("1");
    expect(p.get("filters[id][$in][1]")).toBe("2");
    expect(result).toEqual([
      { id: 1, documentId: "o1", title: "IELTS", slug: "ielts", imageUrl: "img.png" },
      { id: 2, documentId: "o2", title: "", slug: "", imageUrl: "" },
    ]);
  });

  it("returns [] when the response has no data", async () => {
    mockGet.mockResolvedValueOnce({});
    expect(await fetchOfferingsByIds("en", ["1"])).toEqual([]);
  });
});
