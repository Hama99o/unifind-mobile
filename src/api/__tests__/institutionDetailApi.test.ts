/**
 * institutionDetailApi.test.ts — unit tests for the Institution Detail Strapi transport.
 *
 * http is globally mocked. We assert request URLs/params and transformed output,
 * including the degree-binning logic in mapProgramsToFacultyCampuses (via
 * getAcademicUnitsInfo) and the try/catch fallbacks.
 */

import {
  institutionDetailApi,
  DEGREE_TITLE_MAP,
} from "@/api/institutionDetailApi";
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

// ─── getInstitutionBySlug ───────────────────────────────────────────────────────

describe("institutionDetailApi.getInstitutionBySlug", () => {
  it("queries /api/instituitions with slug + locale + status and full populate", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
    await institutionDetailApi.getInstitutionBySlug("aub", "en");
    const p = lastParams();
    expect(lastUrl()).toContain("/api/instituitions?");
    expect(p.get("filters[slug][$eq]")).toBe("aub");
    expect(p.get("filters[locale][$eq]")).toBe("en");
    expect(p.get("status")).toBe("draft");
    // a sampling of populate keys
    expect(p.get("populate[logo][fields][0]")).toBe("url");
    expect(p.get("populate[tuition][populate][degree][fields][0]")).toBe("title");
    expect(p.get("populate[localizations][fields][0]")).toBe("locale");
    expect(p.get("populate[localizations][fields][1]")).toBe("slug");
  });

  it("returns the first data row", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 9, name: "AUB" }, { id: 10 }] } });
    const result = await institutionDetailApi.getInstitutionBySlug("aub", "en");
    expect(result).toEqual({ id: 9, name: "AUB" });
  });

  it("returns null when there are no rows", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    expect(await institutionDetailApi.getInstitutionBySlug("none", "en")).toBeNull();
  });

  it("returns null when the response shape is empty", async () => {
    mockGet.mockResolvedValueOnce({});
    expect(await institutionDetailApi.getInstitutionBySlug("none", "ar")).toBeNull();
  });
});

// ─── getAcademicUnitsInfo (mapProgramsToFacultyCampuses) ────────────────────────

describe("institutionDetailApi.getAcademicUnitsInfo", () => {
  it("encodes slug and appends status + locale", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    await institutionDetailApi.getAcademicUnitsInfo("a b", "ar");
    const url = lastUrl();
    expect(url).toContain("/api/programs/academic-units-info?slug=a%20b");
    expect(url).toContain("status=draft");
    expect(url).toContain("locale=ar");
  });

  it("bins a faculty into Bachelors when a degree title matches a Bachelor variant", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        {
          facultyName: "Engineering",
          campuses: ["Main"],
          degrees: [{ id: 1, documentId: "d1", title: "Bachelor of Engineering" }],
        },
      ],
    });
    const result = await institutionDetailApi.getAcademicUnitsInfo("aub", "en");
    expect(result.Bachelors).toHaveLength(1);
    expect(result.Bachelors[0].facultyName).toBe("Engineering");
    expect(result.Bachelors[0].campuses).toEqual(["Main"]);
    expect(result.Masters).toEqual([]);
    expect(result.PhD).toEqual([]);
    expect(result.Others).toEqual([]);
  });

  it("bins Masters and PhD by their title variants (case-insensitive)", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { facultyName: "Arts", campuses: [], degrees: [{ id: 2, documentId: "d2", title: "masters" }] },
        { facultyName: "Science", campuses: [], degrees: [{ id: 3, documentId: "d3", title: "Ph.D." }] },
      ],
    });
    const result = await institutionDetailApi.getAcademicUnitsInfo("aub", "en");
    expect(result.Masters.map((f) => f.facultyName)).toEqual(["Arts"]);
    expect(result.PhD.map((f) => f.facultyName)).toEqual(["Science"]);
  });

  it("falls through to Others when no degree title matches a known variant", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ facultyName: "Continuing Ed", campuses: [], degrees: [{ id: 4, documentId: "d4", title: "Diploma" }] }],
    });
    const result = await institutionDetailApi.getAcademicUnitsInfo("aub", "en");
    expect(result.Others).toHaveLength(1);
    expect(result.Others[0].facultyName).toBe("Continuing Ed");
  });

  it("falls back to name/about and empty arrays when faculty fields are missing", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ name: "Law", about: "desc text" }], // no facultyName/description/campuses/degrees
    });
    const result = await institutionDetailApi.getAcademicUnitsInfo("aub", "en");
    expect(result.Others).toHaveLength(1);
    expect(result.Others[0].facultyName).toBe("Law");
    expect(result.Others[0].description).toBe("desc text");
    expect(result.Others[0].campuses).toEqual([]);
    expect(result.Others[0].degrees).toEqual([]);
  });

  it("uses '-' fallback for facultyName when neither facultyName nor name present", async () => {
    mockGet.mockResolvedValueOnce({ data: [{ degrees: [] }] });
    const result = await institutionDetailApi.getAcademicUnitsInfo("aub", "en");
    expect(result.Others[0].facultyName).toBe("-");
  });

  it("returns all-empty groups when data is not an array", async () => {
    mockGet.mockResolvedValueOnce({ data: { not: "array" } });
    const result = await institutionDetailApi.getAcademicUnitsInfo("aub", "en");
    expect(result).toEqual({ Bachelors: [], Masters: [], PhD: [], Others: [] });
  });

  it("returns all-empty groups when the request throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("boom"));
    const result = await institutionDetailApi.getAcademicUnitsInfo("aub", "en");
    expect(result).toEqual({ Bachelors: [], Masters: [], PhD: [], Others: [] });
  });
});

// ─── getProgramsForFaculty ──────────────────────────────────────────────────────

describe("institutionDetailApi.getProgramsForFaculty", () => {
  it("filters by institution slug + faculty name and uses $in for given degree titles", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await institutionDetailApi.getProgramsForFaculty("aub", "Engineering", ["Bachelors", "Master's"], "en");
    const p = lastParams();
    expect(p.get("filters[institution][slug]")).toBe("aub");
    expect(p.get("filters[academicUnits][name]")).toBe("Engineering");
    expect(p.get("filters[degree][title][$in][0]")).toBe("Bachelors");
    expect(p.get("filters[degree][title][$in][1]")).toBe("Master's");
    expect(p.get("pagination[pageSize]")).toBe("100");
  });

  it("uses $notIn with ALL_DEGREE_TITLES when degreeTitles is empty (Others tab)", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await institutionDetailApi.getProgramsForFaculty("aub", "Continuing", [], "en");
    const p = lastParams();
    // first excluded title is the first Bachelors variant
    expect(p.get("filters[degree][title][$notIn][0]")).toBe(DEGREE_TITLE_MAP.Bachelors[0]);
    expect(p.get("filters[degree][title][$in][0]")).toBeNull();
  });

  it("uses $notIn when notIn flag is true even with degree titles supplied", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await institutionDetailApi.getProgramsForFaculty("aub", "Fac", ["Masters"], "en", true);
    const p = lastParams();
    expect(p.get("filters[degree][title][$notIn][0]")).toBe(DEGREE_TITLE_MAP.Bachelors[0]);
    expect(p.get("filters[degree][title][$in][0]")).toBeNull();
  });

  it("returns the data array", async () => {
    const rows = [{ id: 1, name: "CS", slug: "cs" }];
    mockGet.mockResolvedValueOnce({ data: { data: rows } });
    expect(await institutionDetailApi.getProgramsForFaculty("aub", "F", ["Masters"], "en")).toBe(rows);
  });

  it("returns [] when data is missing", async () => {
    mockGet.mockResolvedValueOnce({});
    expect(await institutionDetailApi.getProgramsForFaculty("aub", "F", ["Masters"], "en")).toEqual([]);
  });
});

// ─── getInstitutionProgramCount ─────────────────────────────────────────────────

describe("institutionDetailApi.getInstitutionProgramCount", () => {
  it("requests pageSize 1 and returns meta.pagination.total", async () => {
    mockGet.mockResolvedValueOnce({ data: { meta: { pagination: { total: 42 } } } });
    const count = await institutionDetailApi.getInstitutionProgramCount("aub", "en");
    expect(count).toBe(42);
    const url = lastUrl();
    expect(url).toContain("/api/programs?");
    expect(url).toContain("filters[institution][slug][$eq]=aub");
    expect(url).toContain("pagination[pageSize]=1");
  });

  it("returns 0 when total is missing", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    expect(await institutionDetailApi.getInstitutionProgramCount("aub", "en")).toBe(0);
  });

  it("returns 0 when the request throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("fail"));
    expect(await institutionDetailApi.getInstitutionProgramCount("aub", "en")).toBe(0);
  });
});

// ─── getCampusesForInstitution ──────────────────────────────────────────────────

describe("institutionDetailApi.getCampusesForInstitution", () => {
  it("filters campuses by institution slug and maps id/documentId/name", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ id: 1, documentId: "c1", name: "Main" }, { id: 2, documentId: "c2" }] },
    });
    const result = await institutionDetailApi.getCampusesForInstitution("aub", "en");
    expect(lastUrl()).toContain("filters[instituition][slug]=aub");
    expect(result).toEqual([
      { id: 1, documentId: "c1", name: "Main" },
      { id: 2, documentId: "c2", name: "" }, // missing name → ""
    ]);
  });

  it("returns [] when the request throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("x"));
    expect(await institutionDetailApi.getCampusesForInstitution("aub", "en")).toEqual([]);
  });

  it("returns [] when data is missing", async () => {
    mockGet.mockResolvedValueOnce({});
    expect(await institutionDetailApi.getCampusesForInstitution("aub", "en")).toEqual([]);
  });
});

// ─── getAcademicUnitsForCampus ──────────────────────────────────────────────────

describe("institutionDetailApi.getAcademicUnitsForCampus", () => {
  it("filters academic-units by campus id and maps options", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 7, documentId: "f1", name: "Eng" }] } });
    const result = await institutionDetailApi.getAcademicUnitsForCampus(99, "en");
    expect(lastUrl()).toContain("filters[campus][id]=99");
    expect(result).toEqual([{ id: 7, documentId: "f1", name: "Eng" }]);
  });

  it("defaults missing name to '' and returns [] on throw", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
    expect(await institutionDetailApi.getAcademicUnitsForCampus(1, "en")).toEqual([{ id: 1, documentId: undefined, name: "" }]);
    mockGet.mockRejectedValueOnce(new Error("x"));
    expect(await institutionDetailApi.getAcademicUnitsForCampus(1, "en")).toEqual([]);
  });
});

// ─── getProgramsForReviewDropdown ───────────────────────────────────────────────

describe("institutionDetailApi.getProgramsForReviewDropdown", () => {
  it("filters by academicUnits id and builds 'title — name' labels", async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: [{ id: 1, documentId: "p1", name: "Computer Science", degree: { title: "Masters" } }] },
    });
    const result = await institutionDetailApi.getProgramsForReviewDropdown(55, "en");
    expect(lastUrl()).toContain("filters[academicUnits][id]=55");
    expect(result).toEqual([{ documentId: "p1", label: "Masters — Computer Science" }]);
  });

  it("uses just the name when there is no degree title", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 2, documentId: "p2", name: "Physics" }] } });
    const result = await institutionDetailApi.getProgramsForReviewDropdown(55, "en");
    expect(result).toEqual([{ documentId: "p2", label: "Physics" }]);
  });

  it("uses '' name when name is missing but a title exists", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 3, documentId: "p3", degree: { title: "PhD" } }] } });
    const result = await institutionDetailApi.getProgramsForReviewDropdown(55, "en");
    expect(result).toEqual([{ documentId: "p3", label: "PhD — " }]);
  });

  it("returns [] when the request throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("x"));
    expect(await institutionDetailApi.getProgramsForReviewDropdown(1, "en")).toEqual([]);
  });
});
