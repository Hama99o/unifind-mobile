/**
 * offeringsApi.test.ts — unit tests for the two-step Node→Strapi offerings transport.
 *
 * Both axios instances are globally mocked. nodeApi powers step 1 + ratings;
 * http powers step 2 (Strapi). We assert request params, the merge-by-content-id,
 * client-side sort, rating injection (login-gated), and empty/fallback paths.
 */

import { offeringsApi } from "@/api/offeringsApi";
import { nodeApi } from "@/api/nodeApi";
import { http } from "@/api/http";

const mockNodeGet = nodeApi.get as jest.Mock;
const mockHttpGet = http.get as jest.Mock;

function lastUrlOf(mock: jest.Mock): string {
  const call = mock.mock.calls[mock.mock.calls.length - 1];
  return call[0] as string;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── fetchFromNode ──────────────────────────────────────────────────────────────

describe("offeringsApi.fetchFromNode", () => {
  it("requests /offering with page and returns response data", async () => {
    const payload = { success: true, page: 1, limit: 5, totalCount: 0, totalPages: 0, data: [] };
    mockNodeGet.mockResolvedValueOnce({ data: payload });
    const result = await offeringsApi.fetchFromNode({ page: 2, locale: "en" });
    expect(result).toBe(payload);
    const url = lastUrlOf(mockNodeGet);
    expect(url).toContain("/offering?");
    expect(url).toContain("page=2");
  });

  it("appends one categoryId param per id, one offeringContentId per id, and price", async () => {
    mockNodeGet.mockResolvedValueOnce({ data: { data: [] } });
    await offeringsApi.fetchFromNode({
      page: 1,
      locale: "en",
      categoryIds: ["c1", "c2"],
      offeringContentIds: ["o1"],
      priceRange: "10-90",
    });
    const qs = new URLSearchParams(lastUrlOf(mockNodeGet).split("?")[1]);
    expect(qs.getAll("categoryId")).toEqual(["c1", "c2"]);
    expect(qs.getAll("offeringContentId")).toEqual(["o1"]);
    expect(qs.get("price")).toBe("10-90");
  });

  it("omits price param when priceRange not provided", async () => {
    mockNodeGet.mockResolvedValueOnce({ data: { data: [] } });
    await offeringsApi.fetchFromNode({ page: 1, locale: "en" });
    expect(lastUrlOf(mockNodeGet)).not.toContain("price=");
  });
});

// ─── fetchFromStrapi ────────────────────────────────────────────────────────────

describe("offeringsApi.fetchFromStrapi", () => {
  it("returns [] without calling http when ids is empty", async () => {
    const result = await offeringsApi.fetchFromStrapi([], "en");
    expect(result).toEqual([]);
    expect(mockHttpGet).not.toHaveBeenCalled();
  });

  it("builds /api/offerings with locale, id $in filters and populate, returns data", async () => {
    const rows = [{ id: 1, title: "IELTS" }];
    mockHttpGet.mockResolvedValueOnce({ data: { data: rows } });
    const result = await offeringsApi.fetchFromStrapi([1, 2], "en");
    expect(result).toBe(rows);
    const qs = new URLSearchParams(lastUrlOf(mockHttpGet).split("?")[1]);
    expect(lastUrlOf(mockHttpGet)).toContain("/api/offerings?");
    expect(qs.get("filters[locale][$eq]")).toBe("en");
    expect(qs.get("status")).toBe("draft");
    expect(qs.get("filters[id][$in][0]")).toBe("1");
    expect(qs.get("filters[id][$in][1]")).toBe("2");
    expect(qs.get("populate[category][fields][0]")).toBe("name");
    expect(qs.get("populate[location][populate][city][fields][0]")).toBe("name");
  });

  it("returns [] when the strapi response is empty", async () => {
    mockHttpGet.mockResolvedValueOnce({});
    expect(await offeringsApi.fetchFromStrapi([1], "en")).toEqual([]);
  });

  // QA 2026-11-10 BUG-03: Strapi 5 gives each locale its own numeric id; Node
  // stores the EN id. Arabic must resolve EN ids -> documentId -> AR entry.
  it("ar: maps AR translations back to the EN id via documentId, EN fallback when untranslated", async () => {
    const en = [
      { id: 4, documentId: "docA", title: "Stay Cybersafe" },
      { id: 9, documentId: "docB", title: "Unlock Your Future" },
    ];
    const ar = [{ id: 8, documentId: "docA", title: "حافظ على أمانك" }];
    mockHttpGet
      .mockResolvedValueOnce({ data: { data: en } })
      .mockResolvedValueOnce({ data: { data: ar } });

    const result = await offeringsApi.fetchFromStrapi([4, 9], "ar");

    const enQs = new URLSearchParams(mockHttpGet.mock.calls[0][0].split("?")[1]);
    expect(enQs.get("filters[locale][$eq]")).toBe("en");
    expect(enQs.get("filters[id][$in][0]")).toBe("4");
    const arQs = new URLSearchParams(mockHttpGet.mock.calls[1][0].split("?")[1]);
    expect(arQs.get("filters[locale][$eq]")).toBe("ar");
    expect(arQs.get("filters[documentId][$in][0]")).toBe("docA");
    expect(arQs.get("filters[documentId][$in][1]")).toBe("docB");
    expect(arQs.get("filters[id][$in][0]")).toBeNull();

    expect(result).toEqual([
      { id: 4, documentId: "docA", title: "حافظ على أمانك" },
      { id: 9, documentId: "docB", title: "Unlock Your Future" },
    ]);
  });

  it("ar: no second request when no EN entry matched", async () => {
    mockHttpGet.mockResolvedValueOnce({ data: { data: [] } });
    expect(await offeringsApi.fetchFromStrapi([1], "ar")).toEqual([]);
    expect(mockHttpGet).toHaveBeenCalledTimes(1);
  });
});

// ─── fetchOfferingRating ────────────────────────────────────────────────────────

describe("offeringsApi.fetchOfferingRating", () => {
  it("calls the reviews endpoint and returns averageGeneralRating", async () => {
    mockNodeGet.mockResolvedValueOnce({ data: { averages: { averageGeneralRating: 4.5 } } });
    const rating = await offeringsApi.fetchOfferingRating(7);
    expect(rating).toBe(4.5);
    expect(lastUrlOf(mockNodeGet)).toBe("/reviews/all-average-rating/Offering/7");
  });

  it("returns 0 when the message contains 'no reviews' (case-insensitive)", async () => {
    mockNodeGet.mockResolvedValueOnce({ data: { message: "No Reviews found", averages: { averageGeneralRating: 9 } } });
    expect(await offeringsApi.fetchOfferingRating(7)).toBe(0);
  });

  it("returns 0 when averageGeneralRating is missing", async () => {
    mockNodeGet.mockResolvedValueOnce({ data: {} });
    expect(await offeringsApi.fetchOfferingRating(7)).toBe(0);
  });

  it("returns 0 when the request throws", async () => {
    mockNodeGet.mockRejectedValueOnce(new Error("x"));
    expect(await offeringsApi.fetchOfferingRating(7)).toBe(0);
  });
});

// ─── listPage ───────────────────────────────────────────────────────────────────

describe("offeringsApi.listPage", () => {
  it("returns an empty Page (with node meta) when Node yields no items, skipping Strapi", async () => {
    mockNodeGet.mockResolvedValueOnce({
      data: { success: true, page: 1, limit: 5, totalCount: 0, totalPages: 0, data: [] },
    });
    const result = await offeringsApi.listPage({ page: 1, locale: "en" }, false, "default");
    expect(result).toEqual({ items: [], page: 1, pageCount: 0, total: 0 });
    expect(mockHttpGet).not.toHaveBeenCalled();
  });

  it("merges Node + Strapi by content id and returns a Page with node pagination meta", async () => {
    mockNodeGet.mockResolvedValueOnce({
      data: {
        success: true,
        page: 1,
        totalCount: 2,
        totalPages: 3,
        data: [
          { _id: "n1", offeringContentId: "1", slug: "a", minPrice: 50, maxPrice: 80, eventTypes: [] },
          { _id: "n2", offeringContentId: "2", slug: "b", minPrice: 20, maxPrice: 40, eventTypes: [] },
        ],
      },
    });
    mockHttpGet.mockResolvedValueOnce({
      data: { data: [{ id: 1, order: 1, title: "First" }, { id: 2, order: 0, title: "Second" }] },
    });
    const result = await offeringsApi.listPage({ page: 1, locale: "en" }, false, "default");
    expect(result.page).toBe(1);
    expect(result.pageCount).toBe(3);
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    // default sort = strapi order ascending → id 2 (order 0) before id 1 (order 1)
    expect(result.items.map((i) => i.id)).toEqual([2, 1]);
    // merged shape carries nodeData + ratingStars
    expect(result.items[0].nodeData.slug).toBe("b");
    expect(result.items[0].ratingStars).toBe(0);
  });

  it("sorts by node minPrice ascending for sort=price_asc", async () => {
    mockNodeGet.mockResolvedValueOnce({
      data: {
        success: true, page: 1, totalCount: 2, totalPages: 1,
        data: [
          { _id: "n1", offeringContentId: "1", slug: "a", minPrice: 99, eventTypes: [] },
          { _id: "n2", offeringContentId: "2", slug: "b", minPrice: 10, eventTypes: [] },
        ],
      },
    });
    mockHttpGet.mockResolvedValueOnce({ data: { data: [{ id: 1, title: "A" }, { id: 2, title: "B" }] } });
    const result = await offeringsApi.listPage({ page: 1, locale: "en" }, false, "price_asc");
    expect(result.items.map((i) => i.id)).toEqual([2, 1]);
  });

  it("sorts by node minPrice descending for sort=price_desc", async () => {
    mockNodeGet.mockResolvedValueOnce({
      data: {
        success: true, page: 1, totalCount: 2, totalPages: 1,
        data: [
          { _id: "n1", offeringContentId: "1", slug: "a", minPrice: 10, eventTypes: [] },
          { _id: "n2", offeringContentId: "2", slug: "b", minPrice: 99, eventTypes: [] },
        ],
      },
    });
    mockHttpGet.mockResolvedValueOnce({ data: { data: [{ id: 1, title: "A" }, { id: 2, title: "B" }] } });
    const result = await offeringsApi.listPage({ page: 1, locale: "en" }, false, "price_desc");
    expect(result.items.map((i) => i.id)).toEqual([2, 1]);
  });

  it("drops Node items whose content id has no Strapi match", async () => {
    mockNodeGet.mockResolvedValueOnce({
      data: {
        success: true, page: 1, totalCount: 2, totalPages: 1,
        data: [
          { _id: "n1", offeringContentId: "1", slug: "a", eventTypes: [] },
          { _id: "n2", offeringContentId: "999", slug: "orphan", eventTypes: [] },
        ],
      },
    });
    mockHttpGet.mockResolvedValueOnce({ data: { data: [{ id: 1, title: "A" }] } });
    const result = await offeringsApi.listPage({ page: 1, locale: "en" }, false, "default");
    expect(result.items.map((i) => i.id)).toEqual([1]);
  });

  it("injects per-item average ratings when isLoggedIn=true", async () => {
    // call 1: Node list
    mockNodeGet.mockResolvedValueOnce({
      data: {
        success: true, page: 1, totalCount: 1, totalPages: 1,
        data: [{ _id: "n1", offeringContentId: "1", slug: "a", eventTypes: [] }],
      },
    });
    // call 2 (http): Strapi
    mockHttpGet.mockResolvedValueOnce({ data: { data: [{ id: 1, title: "A" }] } });
    // call 2 (node): the rating fetch for offering id 1
    mockNodeGet.mockResolvedValueOnce({ data: { averages: { averageGeneralRating: 3.7 } } });

    const result = await offeringsApi.listPage({ page: 1, locale: "en" }, true, "default");
    expect(result.items[0].ratingStars).toBe(3.7);
  });

  it("filters out NaN strapi ids before the Strapi fetch", async () => {
    mockNodeGet.mockResolvedValueOnce({
      data: {
        success: true, page: 1, totalCount: 2, totalPages: 1,
        data: [
          { _id: "n1", offeringContentId: "1", slug: "a", eventTypes: [] },
          { _id: "n2", offeringContentId: "not-a-number", slug: "b", eventTypes: [] },
        ],
      },
    });
    mockHttpGet.mockResolvedValueOnce({ data: { data: [{ id: 1, title: "A" }] } });
    await offeringsApi.listPage({ page: 1, locale: "en" }, false, "default");
    const qs = new URLSearchParams(lastUrlOf(mockHttpGet).split("?")[1]);
    // only the valid id 1 should be present; index 1 should not exist
    expect(qs.get("filters[id][$in][0]")).toBe("1");
    expect(qs.get("filters[id][$in][1]")).toBeNull();
  });
});
