/**
 * catalog.test.ts — Strapi CMS catalog transport layer (read-only).
 *
 * `http` is globally mocked. Tests feed strapi-shaped responses and assert both
 * the URL/params passed and the mapped/transformed result.
 *
 * Coverage:
 *   extractPlainText                 — paragraph filtering, join, trim, edge cases
 *   fetchDegreeLevels                — dedup by label, insertion order, skip empties
 *   fetchProgramFields               — dedup + localeCompare sort
 *   fetchProgramLocations            — dedup by city, value=label=city
 *   fetchInstitutionLocations        — dedup by gov,city, parent=gov
 *   fetchOfferingFields              — dedup + sort
 *   fetchOfferingCategories          — dedup + sort
 *   fetchFeaturedInstitutions        — field mapping + fallbacks + params
 *   fetchFeaturedOfferings           — field mapping + category null/object + params
 */

import { http } from "@/api/http";
import {
  extractPlainText,
  fetchDegreeLevels,
  fetchProgramFields,
  fetchProgramLocations,
  fetchInstitutionLocations,
  fetchOfferingFields,
  fetchOfferingCategories,
  fetchFeaturedInstitutions,
  fetchFeaturedOfferings,
} from "@/api/catalog";

const mockGet = http.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── extractPlainText ───────────────────────────────────────────────────────────

describe("extractPlainText", () => {
  it("joins text nodes of paragraph blocks with a space", () => {
    const blocks = [
      { type: "paragraph", children: [{ text: "Hello" }, { text: "world" }] },
    ];
    expect(extractPlainText(blocks)).toBe("Hello world");
  });

  it("ignores non-paragraph blocks (e.g. headings, lists)", () => {
    const blocks = [
      { type: "heading", children: [{ text: "Title" }] },
      { type: "paragraph", children: [{ text: "Body" }] },
    ];
    expect(extractPlainText(blocks)).toBe("Body");
  });

  it("flattens text across multiple paragraphs", () => {
    const blocks = [
      { type: "paragraph", children: [{ text: "First." }] },
      { type: "paragraph", children: [{ text: "Second." }] },
    ];
    expect(extractPlainText(blocks)).toBe("First. Second.");
  });

  it("treats a missing text node as empty string", () => {
    const blocks = [{ type: "paragraph", children: [{}, { text: "tail" }] }];
    // "" joined with "tail" → " tail" then trimmed → "tail"
    expect(extractPlainText(blocks)).toBe("tail");
  });

  it("returns '' for null / undefined / non-array input", () => {
    expect(extractPlainText(null)).toBe("");
    expect(extractPlainText(undefined)).toBe("");
    expect(extractPlainText("not blocks")).toBe("");
    expect(extractPlainText({})).toBe("");
  });

  it("returns '' for an empty blocks array", () => {
    expect(extractPlainText([])).toBe("");
  });

  it("handles a paragraph with no children (uses [] fallback)", () => {
    expect(extractPlainText([{ type: "paragraph" }])).toBe("");
  });
});

// ─── fetchDegreeLevels ──────────────────────────────────────────────────────────

describe("fetchDegreeLevels", () => {
  it("maps distinct degree titles to { label, value } preserving insertion order", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { degree: { title: "Bachelor" } },
        { degree: { title: "Master" } },
      ],
    });
    const result = await fetchDegreeLevels("en");
    expect(result).toEqual([
      { label: "Bachelor", value: "Bachelor" },
      { label: "Master", value: "Master" },
    ]);
    expect(mockGet).toHaveBeenCalledWith(
      "api/programs/distinct-degrees-programs?status=draft&locale=en"
    );
  });

  it("dedupes repeated titles (keeps first occurrence)", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { degree: { title: "Bachelor" } },
        { degree: { title: "Bachelor" } },
        { degree: { title: "PhD" } },
      ],
    });
    const result = await fetchDegreeLevels("en");
    expect(result.map((r) => r.value)).toEqual(["Bachelor", "PhD"]);
  });

  it("skips entries with an empty or missing title", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ degree: { title: "" } }, { degree: {} }, {}, { degree: { title: "Diploma" } }],
    });
    const result = await fetchDegreeLevels("en");
    expect(result).toEqual([{ label: "Diploma", value: "Diploma" }]);
  });

  it("does NOT sort (insertion order, unlike fetchProgramFields)", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ degree: { title: "Zoology" } }, { degree: { title: "Architecture" } }],
    });
    const result = await fetchDegreeLevels("ar");
    expect(result.map((r) => r.label)).toEqual(["Zoology", "Architecture"]);
  });
});

// ─── fetchProgramFields ─────────────────────────────────────────────────────────

describe("fetchProgramFields", () => {
  it("dedupes then sorts alphabetically by label", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { fieldOfStudy: { name: "Medicine" } },
        { fieldOfStudy: { name: "Arts" } },
        { fieldOfStudy: { name: "Medicine" } },
      ],
    });
    const result = await fetchProgramFields("en");
    expect(result.map((r) => r.label)).toEqual(["Arts", "Medicine"]);
    expect(mockGet).toHaveBeenCalledWith(
      "api/programs/fields-program-ids?status=draft&locale=en"
    );
  });

  it("skips empty names and returns [] when none valid", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ fieldOfStudy: { name: "" } }, {}],
    });
    expect(await fetchProgramFields("ar")).toEqual([]);
  });
});

// ─── fetchProgramLocations ──────────────────────────────────────────────────────

describe("fetchProgramLocations", () => {
  it("builds the campus.location populate query with status=draft and pageSize 1000", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await fetchProgramLocations("en");
    const url: string = mockGet.mock.calls[0][0];
    const decoded = decodeURIComponent(url);
    expect(url.startsWith("/api/programs?")).toBe(true);
    expect(decoded).toContain("filters[locale][$eq]=en");
    expect(url).toContain("status=draft");
    expect(decoded).toContain("pagination[pageSize]=1000");
  });

  it("returns unique city options (label === value === city name)", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            campus: [
              { location: { city: { name: "Beirut" }, district: { governorate: "Beirut" } } },
              { location: { city: { name: "Beirut" }, district: { governorate: "Beirut" } } },
            ],
          },
          {
            campus: [
              { location: { city: { name: "Tripoli" }, district: { governorate: "North" } } },
            ],
          },
        ],
      },
    });
    const result = await fetchProgramLocations("en");
    expect(result).toEqual([
      { label: "Beirut", value: "Beirut" },
      { label: "Tripoli", value: "Tripoli" },
    ]);
  });

  it("skips campuses with no city name", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ campus: [{ location: { district: { governorate: "X" } } }] }] },
    });
    expect(await fetchProgramLocations("en")).toEqual([]);
  });

  it("returns [] when data.data is missing", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    expect(await fetchProgramLocations("en")).toEqual([]);
  });
});

// ─── fetchInstitutionLocations ──────────────────────────────────────────────────

describe("fetchInstitutionLocations", () => {
  it("queries /api/campuses with the location populate and pageSize 1000", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await fetchInstitutionLocations("ar");
    const url: string = mockGet.mock.calls[0][0];
    const decoded = decodeURIComponent(url);
    expect(url.startsWith("/api/campuses?")).toBe(true);
    expect(decoded).toContain("filters[locale][$eq]=ar");
    expect(decoded).toContain("pagination[pageSize]=1000");
  });

  it("dedupes by 'gov,city' and sets parent to the governorate", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          { location: { city: { name: "Beirut" }, district: { governorate: "Beirut Gov" } } },
          { location: { city: { name: "Beirut" }, district: { governorate: "Beirut Gov" } } },
          { location: { city: { name: "Saida" }, district: { governorate: "South" } } },
        ],
      },
    });
    const result = await fetchInstitutionLocations("en");
    expect(result).toEqual([
      { label: "Beirut", value: "Beirut Gov,Beirut", parent: "Beirut Gov" },
      { label: "Saida", value: "South,Saida", parent: "South" },
    ]);
  });

  it("treats a missing governorate as empty parent and value prefix", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ location: { city: { name: "Jounieh" } } }] },
    });
    const result = await fetchInstitutionLocations("en");
    expect(result).toEqual([
      { label: "Jounieh", value: ",Jounieh", parent: "" },
    ]);
  });

  it("skips campuses with no city name", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ location: { district: { governorate: "G" } } }] },
    });
    expect(await fetchInstitutionLocations("en")).toEqual([]);
  });
});

// ─── fetchOfferingFields ────────────────────────────────────────────────────────

describe("fetchOfferingFields", () => {
  it("dedupes and sorts offering field names", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { field: { name: "Writing" } },
        { field: { name: "Coding" } },
        { field: { name: "Writing" } },
      ],
    });
    const result = await fetchOfferingFields("en");
    expect(result.map((r) => r.label)).toEqual(["Coding", "Writing"]);
    expect(mockGet).toHaveBeenCalledWith(
      "/api/offerings/field-usage?status=draft&locale=en"
    );
  });

  it("returns [] when no valid names", async () => {
    mockGet.mockResolvedValueOnce({ data: [{ field: {} }] });
    expect(await fetchOfferingFields("ar")).toEqual([]);
  });
});

// ─── fetchOfferingCategories ────────────────────────────────────────────────────

describe("fetchOfferingCategories", () => {
  it("dedupes and sorts offering category names", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { category: { name: "Tutoring" } },
        { category: { name: "Bootcamp" } },
        { category: { name: "Tutoring" } },
      ],
    });
    const result = await fetchOfferingCategories("en");
    expect(result.map((r) => r.value)).toEqual(["Bootcamp", "Tutoring"]);
    expect(mockGet).toHaveBeenCalledWith(
      "/api/offerings/category-usage?status=draft&locale=en"
    );
  });

  it("returns [] when category name is missing", async () => {
    mockGet.mockResolvedValueOnce({ data: [{}] });
    expect(await fetchOfferingCategories("en")).toEqual([]);
  });
});

// ─── fetchFeaturedInstitutions ──────────────────────────────────────────────────

describe("fetchFeaturedInstitutions", () => {
  it("maps strapi rows to FeaturedInstitution with nested url + location fallbacks", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            documentId: "doc-1",
            name: "Acme University",
            slug: "acme",
            about: [{ type: "paragraph", children: [{ text: "About." }] }],
            logo: { url: "https://cdn/logo.png" },
            photoCover: { url: "https://cdn/cover.png" },
            mainLocation: { street: "Main St", city: { name: "Beirut" } },
          },
        ],
      },
    });
    const result = await fetchFeaturedInstitutions("en");
    expect(result).toEqual([
      {
        id: 1,
        documentId: "doc-1",
        name: "Acme University",
        slug: "acme",
        about: [{ type: "paragraph", children: [{ text: "About." }] }],
        photoCoverUrl: "https://cdn/cover.png",
        logoUrl: "https://cdn/logo.png",
        mainLocation: { street: "Main St", cityName: "Beirut" },
      },
    ]);
  });

  it("falls back to empty strings when nested objects are null/missing", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          { id: 2, documentId: "doc-2", logo: null, photoCover: null, mainLocation: null },
        ],
      },
    });
    const [inst] = await fetchFeaturedInstitutions("en");
    expect(inst.name).toBe("");
    expect(inst.slug).toBe("");
    expect(inst.logoUrl).toBe("");
    expect(inst.photoCoverUrl).toBe("");
    expect(inst.mainLocation).toEqual({ street: "", cityName: "" });
  });

  it("targets the misspelled /api/instituitions endpoint with featured + pageSize 6", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await fetchFeaturedInstitutions("ar");
    const url: string = mockGet.mock.calls[0][0];
    const decoded = decodeURIComponent(url);
    expect(url.startsWith("/api/instituitions?")).toBe(true);
    expect(decoded).toContain("filters[featured][$eq]=true");
    expect(decoded).toContain("pagination[pageSize]=6");
    expect(decoded).toContain("sort[0]=order:asc");
    expect(decoded).toContain("filters[locale][$eq]=ar");
  });

  it("returns [] when data.data is missing", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    expect(await fetchFeaturedInstitutions("en")).toEqual([]);
  });
});

// ─── fetchFeaturedOfferings ─────────────────────────────────────────────────────

describe("fetchFeaturedOfferings", () => {
  it("maps strapi rows to FeaturedOffering with a populated category object", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 5,
            documentId: "off-5",
            slug: "ielts",
            title: "IELTS Prep",
            description: [{ type: "paragraph", children: [{ text: "Desc." }] }],
            image: { url: "https://cdn/img.png" },
            category: { name: "Test Prep", icon: "book" },
          },
        ],
      },
    });
    const result = await fetchFeaturedOfferings("en");
    expect(result).toEqual([
      {
        id: 5,
        documentId: "off-5",
        slug: "ielts",
        title: "IELTS Prep",
        description: [{ type: "paragraph", children: [{ text: "Desc." }] }],
        imageUrl: "https://cdn/img.png",
        category: { name: "Test Prep", icon: "book" },
      },
    ]);
  });

  it("sets category to null when the offering has no category", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ id: 6, documentId: "off-6", category: null, image: null }] },
    });
    const [off] = await fetchFeaturedOfferings("en");
    expect(off.category).toBeNull();
    expect(off.imageUrl).toBe("");
    expect(off.title).toBe("");
    expect(off.slug).toBe("");
  });

  it("falls back to empty strings for category name/icon when partially populated", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ id: 7, documentId: "off-7", category: {} }] },
    });
    const [off] = await fetchFeaturedOfferings("en");
    expect(off.category).toEqual({ name: "", icon: "" });
  });

  it("targets /api/offerings with featured + pageSize 5", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await fetchFeaturedOfferings("en");
    const url: string = mockGet.mock.calls[0][0];
    const decoded = decodeURIComponent(url);
    expect(url.startsWith("/api/offerings?")).toBe(true);
    expect(decoded).toContain("filters[featured][$eq]=true");
    expect(decoded).toContain("pagination[pageSize]=5");
  });
});
