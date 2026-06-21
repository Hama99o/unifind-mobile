/**
 * programsApi.test.ts — unit tests for the Find-Programs Strapi transport.
 *
 * http is globally mocked. We assert request params (filters/sort/tuition/
 * pagination) and the Page<ProgramListItem> mapping.
 *
 * NOTE: tuition params are appended to the URL as a RAW suffix (tuitionQs)
 * AFTER qp.toString(), so they still parse cleanly via URLSearchParams.
 */

import { programsApi } from "@/api/programsApi";
import { http } from "@/api/http";

const mockGet = http.get as jest.Mock;

function lastUrl(): string {
  const call = mockGet.mock.calls[mockGet.mock.calls.length - 1];
  return call[0] as string;
}
function lastParams(): URLSearchParams {
  return new URLSearchParams(lastUrl().split("?")[1] ?? "");
}
const emptyPage = { data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } } };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("programsApi.list", () => {
  it("hits /api/programs with locale, default sort name:asc, default pageSize 5", async () => {
    mockGet.mockResolvedValueOnce(emptyPage);
    await programsApi.list({ locale: "en", page: 1 });
    const p = lastParams();
    expect(lastUrl()).toContain("/api/programs?");
    expect(p.get("filters[locale][$eq]")).toBe("en");
    expect(p.get("sort[0]")).toBe("name:asc");
    expect(p.get("pagination[page]")).toBe("1");
    expect(p.get("pagination[pageSize]")).toBe("5");
    expect(p.get("status")).toBe("draft");
  });

  it("appends program list fields and core populate keys", async () => {
    mockGet.mockResolvedValueOnce(emptyPage);
    await programsApi.list({ locale: "en", page: 1 });
    const p = lastParams();
    expect(p.get("fields[0]")).toBe("id");
    expect(p.get("fields[3]")).toBe("name");
    expect(p.get("populate[degree][fields][0]")).toBe("title");
    expect(p.get("populate[specialisations][populate][studyField][fields][0]")).toBe("name");
    expect(p.get("populate[institution][populate][tuition][fields][0]")).toBe("minTuition");
    expect(p.get("populate[campus][populate][location][populate][city][fields][0]")).toBe("name");
  });

  it("builds the 7-clause $or search when search is set (trimmed)", async () => {
    mockGet.mockResolvedValueOnce(emptyPage);
    await programsApi.list({ locale: "en", page: 1, search: "  data  " });
    const p = lastParams();
    expect(p.get("filters[$or][0][name][$containsi]")).toBe("data");
    expect(p.get("filters[$or][1][specialisations][studyField][name][$containsi]")).toBe("data");
    expect(p.get("filters[$or][2][specialisations][name][$containsi]")).toBe("data");
    expect(p.get("filters[$or][3][about][$containsi]")).toBe("data");
    expect(p.get("filters[$or][4][institution][name][$containsi]")).toBe("data");
    expect(p.get("filters[$or][5][academicUnits][name][$containsi]")).toBe("data");
    expect(p.get("filters[$or][6][campus][name][$containsi]")).toBe("data");
  });

  it("omits search clauses for empty/whitespace search", async () => {
    mockGet.mockResolvedValueOnce(emptyPage);
    await programsApi.list({ locale: "en", page: 1, search: "  " });
    expect(lastParams().get("filters[$or][0][name][$containsi]")).toBeNull();
  });

  it("appends degree / fieldOfStudy / location $in filters", async () => {
    mockGet.mockResolvedValueOnce(emptyPage);
    await programsApi.list({
      locale: "en",
      page: 1,
      degreeIds: ["1", "2"],
      fieldOfStudyIds: ["10"],
      locationIds: ["100", "200"],
    });
    const p = lastParams();
    expect(p.get("filters[degree][id][$in][0]")).toBe("1");
    expect(p.get("filters[degree][id][$in][1]")).toBe("2");
    expect(p.get("filters[specialisations][studyField][id][$in][0]")).toBe("10");
    expect(p.get("filters[campus][location][id][$in][0]")).toBe("100");
    expect(p.get("filters[campus][location][id][$in][1]")).toBe("200");
  });

  it("appends nbOfYears min/max and language $in filters (stringified numbers)", async () => {
    mockGet.mockResolvedValueOnce(emptyPage);
    await programsApi.list({
      locale: "en",
      page: 1,
      nbOfYearsMins: [3, 4],
      nbOfYearsMaxs: [5],
      languageIds: ["7"],
    });
    const p = lastParams();
    expect(p.get("filters[nbOfYears][min][$in][0]")).toBe("3");
    expect(p.get("filters[nbOfYears][min][$in][1]")).toBe("4");
    expect(p.get("filters[nbOfYears][max][$in][0]")).toBe("5");
    expect(p.get("filters[languages][id][$in][0]")).toBe("7");
  });

  it("does not append any dynamic filter for empty arrays", async () => {
    mockGet.mockResolvedValueOnce(emptyPage);
    await programsApi.list({
      locale: "en",
      page: 1,
      degreeIds: [],
      fieldOfStudyIds: [],
      locationIds: [],
      nbOfYearsMins: [],
      nbOfYearsMaxs: [],
      languageIds: [],
    });
    const p = lastParams();
    expect(p.get("filters[degree][id][$in][0]")).toBeNull();
    expect(p.get("filters[languages][id][$in][0]")).toBeNull();
  });

  it("sorts by institution.tuition.minTuition:asc for sort=tuition_asc", async () => {
    mockGet.mockResolvedValueOnce(emptyPage);
    await programsApi.list({ locale: "en", page: 1, sort: "tuition_asc" });
    expect(lastParams().get("sort[0]")).toBe("institution.tuition.minTuition:asc");
  });

  it("sorts by institution.tuition.maxTuition:desc for sort=tuition_desc", async () => {
    mockGet.mockResolvedValueOnce(emptyPage);
    await programsApi.list({ locale: "en", page: 1, sort: "tuition_desc" });
    expect(lastParams().get("sort[0]")).toBe("institution.tuition.maxTuition:desc");
  });

  it("appends tuition gte/lte ONLY when BOTH tuitionMin and tuitionMax are defined", async () => {
    mockGet.mockResolvedValueOnce(emptyPage);
    await programsApi.list({ locale: "en", page: 1, tuitionMin: 0, tuitionMax: 2500 });
    const p = lastParams();
    expect(p.get("filters[institution][tuition][minTuition][$gte]")).toBe("0");
    expect(p.get("filters[institution][tuition][maxTuition][$lte]")).toBe("2500");
    expect(lastUrl()).toContain("filters[institution][tuition][minTuition][$gte]=0");
  });

  it("omits tuition filters when only one of min/max is defined", async () => {
    mockGet.mockResolvedValueOnce(emptyPage);
    await programsApi.list({ locale: "en", page: 1, tuitionMin: 100 }); // max undefined
    const p = lastParams();
    expect(p.get("filters[institution][tuition][minTuition][$gte]")).toBeNull();
  });

  it("omits tuition filters when both are undefined (slider at default range)", async () => {
    mockGet.mockResolvedValueOnce(emptyPage);
    await programsApi.list({ locale: "en", page: 1 });
    expect(lastUrl()).not.toContain("minTuition][$gte]");
  });

  it("maps the strapi response to a Page<ProgramListItem>", async () => {
    const rows = [{ id: 1, name: "CS", slug: "cs" }];
    mockGet.mockResolvedValueOnce({
      data: { data: rows, meta: { pagination: { page: 2, pageCount: 4, total: 18 } } },
    });
    const result = await programsApi.list({ locale: "en", page: 2 });
    expect(result).toEqual({ items: rows, page: 2, pageCount: 4, total: 18 });
  });

  it("falls back to empty items + default meta when response is empty", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    const result = await programsApi.list({ locale: "ar", page: 1 });
    expect(result).toEqual({ items: [], page: 1, pageCount: 1, total: 0 });
  });
});
