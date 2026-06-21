/**
 * academicApi.test.ts — unit tests for academic/professional backgrounds (Node)
 * plus the Strapi catalog cascade (catalogApi).
 *
 * nodeApi + http are globally mocked. Covers request shape, name enrichment from
 * Strapi (getAssignedInstitutions/getAssignedPrograms), and the extractName
 * fallback (attributes.name | name | title).
 *
 * Quirk note: getAcademicBackgrounds / getProfessionalBackgrounds read
 * `res.data.data` directly (no optional chaining on res.data), so the response
 * must always carry a `data` object.
 */

import { academicApi, catalogApi } from "@/api/academicApi";
import { nodeApi } from "@/api/nodeApi";
import { http } from "@/api/http";

const mockNodeGet = nodeApi.get as jest.Mock;
const mockNodePost = nodeApi.post as jest.Mock;
const mockNodePut = nodeApi.put as jest.Mock;
const mockNodeDelete = nodeApi.delete as jest.Mock;
const mockHttpGet = http.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getAcademicBackgrounds (with Strapi enrichment) ────────────────────────────

describe("academicApi.getAcademicBackgrounds", () => {
  it("encodes the userId into the GET path", async () => {
    mockNodeGet.mockResolvedValueOnce({ data: { data: [] } });
    await academicApi.getAcademicBackgrounds("auth0|abc", "en");
    expect(mockNodeGet.mock.calls[0][0]).toBe("/academic-backgrounds/user/auth0%7Cabc");
  });

  it("returns [] (no Strapi calls) when there are no raw records", async () => {
    mockNodeGet.mockResolvedValueOnce({ data: { data: [] } });
    const result = await academicApi.getAcademicBackgrounds("u1", "en");
    expect(result).toEqual([]);
    expect(mockHttpGet).not.toHaveBeenCalled();
  });

  it("enriches records with institution + program names resolved from Strapi", async () => {
    mockNodeGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            _id: "b1",
            userId: "u1",
            university_id: "10",
            program_id: "20",
            grade: 90,
            startDate: "2020-01-01",
            endDate: "2024-01-01",
            isStudent: false,
            description: "desc",
          },
        ],
      },
    });
    // Promise.all order: [0]=institutions, [1]=programs
    mockHttpGet
      .mockResolvedValueOnce({ data: { data: [{ id: 10, name: "AUB" }] } }) // institutions
      .mockResolvedValueOnce({ data: { data: [{ id: 20, name: "Computer Science" }] } }); // programs

    const result = await academicApi.getAcademicBackgrounds("u1", "en");
    expect(result).toEqual([
      {
        _id: "b1",
        university_id: "10",
        institutionName: "AUB",
        program_id: "20",
        programName: "Computer Science",
        startDate: "2020-01-01",
        endDate: "2024-01-01",
        grade: 90,
        isStudent: false,
        description: "desc",
      },
    ]);
  });

  it("passes deduped numeric ids as $in filters to both Strapi endpoints", async () => {
    mockNodeGet.mockResolvedValueOnce({
      data: {
        data: [
          { _id: "b1", userId: "u1", university_id: "10", program_id: "20", startDate: "d", isStudent: true },
          { _id: "b2", userId: "u1", university_id: "10", program_id: "30", startDate: "d", isStudent: true },
        ],
      },
    });
    mockHttpGet.mockResolvedValue({ data: { data: [] } });
    await academicApi.getAcademicBackgrounds("u1", "en");

    const instCall = mockHttpGet.mock.calls.find((c) => String(c[0]).includes("/api/instituitions"));
    const progCall = mockHttpGet.mock.calls.find((c) => String(c[0]).includes("/api/programs"));
    const instParams = new URLSearchParams(String(instCall?.[0]).split("?")[1]);
    const progParams = new URLSearchParams(String(progCall?.[0]).split("?")[1]);
    // university id 10 deduped to a single entry
    expect(instParams.get("filters[id][$in][0]")).toBe("10");
    expect(instParams.get("filters[id][$in][1]")).toBeNull();
    // program ids 20 and 30
    expect(progParams.get("filters[id][$in][0]")).toBe("20");
    expect(progParams.get("filters[id][$in][1]")).toBe("30");
  });

  it("leaves names undefined when Strapi enrichment throws (map returns empty)", async () => {
    mockNodeGet.mockResolvedValueOnce({
      data: { data: [{ _id: "b1", userId: "u1", university_id: "10", program_id: "20", startDate: "d", isStudent: true }] },
    });
    mockHttpGet.mockRejectedValue(new Error("strapi down"));
    const result = await academicApi.getAcademicBackgrounds("u1", "en");
    expect(result[0].institutionName).toBeUndefined();
    expect(result[0].programName).toBeUndefined();
  });
});

// ─── academic background mutations ──────────────────────────────────────────────

describe("academicApi academic mutations", () => {
  const dto = {
    university_id: 1,
    program_id: 2,
    startDate: "2020-01-01",
    isStudent: true,
  };

  it("POSTs to /academic-backgrounds and returns data.data", async () => {
    mockNodePost.mockResolvedValueOnce({ data: { data: { _id: "new" } } });
    const result = await academicApi.addAcademicBackground(dto);
    expect(mockNodePost).toHaveBeenCalledWith("/academic-backgrounds", dto);
    expect(result).toEqual({ _id: "new" });
  });

  it("PUTs to /academic-backgrounds/:id and returns data.data", async () => {
    mockNodePut.mockResolvedValueOnce({ data: { data: { _id: "b1" } } });
    const result = await academicApi.updateAcademicBackground("b1", dto);
    expect(mockNodePut).toHaveBeenCalledWith("/academic-backgrounds/b1", dto);
    expect(result).toEqual({ _id: "b1" });
  });

  it("DELETEs /academic-backgrounds/:id", async () => {
    mockNodeDelete.mockResolvedValueOnce({ data: {} });
    await academicApi.deleteAcademicBackground("b1");
    expect(mockNodeDelete).toHaveBeenCalledWith("/academic-backgrounds/b1");
  });
});

// ─── professional backgrounds ───────────────────────────────────────────────────

describe("academicApi professional backgrounds", () => {
  const dto = {
    jobTitle: "Dev",
    companyName: "Acme",
    employmentType: "full",
    location: { country: "LB", city: "Beirut" },
    startDate: "2021-01-01",
    isCurrent: true,
  };

  it("GETs /professional-backgrounds and returns data.data", async () => {
    mockNodeGet.mockResolvedValueOnce({ data: { data: [{ _id: "p1" }] } });
    const result = await academicApi.getProfessionalBackgrounds();
    expect(mockNodeGet).toHaveBeenCalledWith("/professional-backgrounds");
    expect(result).toEqual([{ _id: "p1" }]);
  });

  it("returns [] when professional data is missing", async () => {
    mockNodeGet.mockResolvedValueOnce({ data: {} });
    expect(await academicApi.getProfessionalBackgrounds()).toEqual([]);
  });

  it("POSTs / PUTs / DELETEs professional backgrounds", async () => {
    mockNodePost.mockResolvedValueOnce({ data: { data: { _id: "p1" } } });
    expect(await academicApi.addProfessionalBackground(dto)).toEqual({ _id: "p1" });
    expect(mockNodePost).toHaveBeenCalledWith("/professional-backgrounds", dto);

    mockNodePut.mockResolvedValueOnce({ data: { data: { _id: "p1" } } });
    expect(await academicApi.updateProfessionalBackground("p1", dto)).toEqual({ _id: "p1" });
    expect(mockNodePut).toHaveBeenCalledWith("/professional-backgrounds/p1", dto);

    mockNodeDelete.mockResolvedValueOnce({ data: {} });
    await academicApi.deleteProfessionalBackground("p1");
    expect(mockNodeDelete).toHaveBeenCalledWith("/professional-backgrounds/p1");
  });
});

// ─── catalogApi (Strapi cascade) ────────────────────────────────────────────────

describe("catalogApi.getInstitutions", () => {
  it("requests /api/instituitions with locale + pageSize and maps id/name/slug", async () => {
    mockHttpGet.mockResolvedValueOnce({ data: { data: [{ id: 1, name: "AUB", slug: "aub" }] } });
    const result = await catalogApi.getInstitutions("en");
    expect(mockHttpGet.mock.calls[0][0]).toBe("/api/instituitions");
    expect(mockHttpGet.mock.calls[0][1]).toMatchObject({
      params: expect.objectContaining({ locale: "en", "pagination[pageSize]": 200, status: "draft" }),
    });
    expect(result).toEqual([{ id: 1, name: "AUB", slug: "aub" }]);
  });

  it("reads name + slug from the attributes wrapper when present", async () => {
    mockHttpGet.mockResolvedValueOnce({
      data: { data: [{ id: 2, attributes: { name: "LAU", slug: "lau" } }] },
    });
    const result = await catalogApi.getInstitutions("en");
    expect(result).toEqual([{ id: 2, name: "LAU", slug: "lau" }]);
  });

  it("returns [] when data is missing", async () => {
    mockHttpGet.mockResolvedValueOnce({ data: {} });
    expect(await catalogApi.getInstitutions("en")).toEqual([]);
  });
});

describe("catalogApi.getCampusesBySlug", () => {
  it("filters campuses by institution slug and maps id/name", async () => {
    mockHttpGet.mockResolvedValueOnce({ data: { data: [{ id: 5, name: "Main" }] } });
    const result = await catalogApi.getCampusesBySlug("aub", "en");
    expect(mockHttpGet.mock.calls[0][1]).toMatchObject({
      params: expect.objectContaining({ "filters[instituition][slug]": "aub" }),
    });
    expect(result).toEqual([{ id: 5, name: "Main" }]);
  });
});

describe("catalogApi.getCampuses", () => {
  it("filters by numeric institution id", async () => {
    mockHttpGet.mockResolvedValueOnce({ data: { data: [{ id: 5, name: "Main" }] } });
    await catalogApi.getCampuses(42, "en");
    expect(mockHttpGet.mock.calls[0][1]).toMatchObject({
      params: expect.objectContaining({ "filters[instituition][id][$eq]": 42 }),
    });
  });
});

describe("catalogApi.getFaculties", () => {
  it("filters academic-units by campus id and maps options", async () => {
    mockHttpGet.mockResolvedValueOnce({ data: { data: [{ id: 7, name: "Eng" }] } });
    const result = await catalogApi.getFaculties(99, "en");
    expect(mockHttpGet.mock.calls[0][0]).toBe("/api/academic-units");
    expect(mockHttpGet.mock.calls[0][1]).toMatchObject({
      params: expect.objectContaining({ "filters[campus][id]": 99 }),
    });
    expect(result).toEqual([{ id: 7, name: "Eng" }]);
  });
});

describe("catalogApi.getProgramsByFaculty", () => {
  it("filters programs by academicUnits id", async () => {
    mockHttpGet.mockResolvedValueOnce({ data: { data: [{ id: 1, name: "CS" }] } });
    const result = await catalogApi.getProgramsByFaculty(55, "en");
    expect(mockHttpGet.mock.calls[0][1]).toMatchObject({
      params: expect.objectContaining({ "filters[academicUnits][id]": 55 }),
    });
    expect(result).toEqual([{ id: 1, name: "CS" }]);
  });
});

describe("catalogApi.getPrograms", () => {
  it("filters by institution id, omitting campus filter when not provided", async () => {
    mockHttpGet.mockResolvedValueOnce({ data: { data: [{ id: 1, name: "CS" }] } });
    await catalogApi.getPrograms(42);
    const params = mockHttpGet.mock.calls[0][1].params;
    expect(params["filters[institution][id][$eq]"]).toBe(42);
    expect(params["filters[campus][id][$eq]"]).toBeUndefined();
  });

  it("adds the campus filter when campusId is given, and maps via extractName fallback (title)", async () => {
    mockHttpGet.mockResolvedValueOnce({ data: { data: [{ id: 9, title: "Some Title" }] } });
    const result = await catalogApi.getPrograms(42, 7);
    const params = mockHttpGet.mock.calls[0][1].params;
    expect(params["filters[campus][id][$eq]"]).toBe(7);
    // no name → extractName falls back to title
    expect(result).toEqual([{ id: 9, name: "Some Title" }]);
  });

  it("returns [] when data is missing", async () => {
    mockHttpGet.mockResolvedValueOnce({ data: {} });
    expect(await catalogApi.getPrograms(1)).toEqual([]);
  });
});
