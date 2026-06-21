/**
 * academicApi — Node API transport for academic & professional backgrounds.
 *
 * Backend: Node (nodeApi + Auth0 Bearer token) for backgrounds.
 * Strapi (http) for institution/campus/faculty/program cascade lookups.
 *
 * Field contract (mirrors web UFAcademicBackground.tsx + AcademicBackgroundController.ts):
 *   POST/PUT body: { university_id: Number, program_id: Number, isStudent: boolean,
 *                    startDate, endDate?, grade?, description? }
 *   GET endpoint: /academic-backgrounds/user/:userId  (userId = Auth0 sub)
 *
 * The GET response is enriched on the mobile side with institution + program
 * names from Strapi (mirrors web getAssignedInstitutions / getAssignedPrograms).
 */

import { nodeApi } from "@/api/nodeApi";
import { http } from "@/api/http";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Raw record returned by /academic-backgrounds/user/:userId */
export interface AcademicBackgroundRaw {
  _id: string;
  userId: string;
  /** Stored as a String in MongoDB (numeric Strapi id) */
  university_id: string;
  program_id: string;
  grade?: number;
  startDate: string;
  endDate?: string;
  isStudent: boolean;
  description?: string;
}

/** Enriched record with names resolved from Strapi. */
export interface AcademicBackground {
  _id: string;
  university_id: string;
  institutionName?: string;
  program_id: string;
  programName?: string;
  startDate: string;
  endDate?: string;
  grade?: number;
  isStudent: boolean;
  description?: string;
}

/** POST/PUT body — mirrors the web payload exactly (AcademicBackgroundController.ts) */
export interface AcademicBackgroundDto {
  university_id: number;
  program_id: number;
  startDate: string;
  endDate?: string;
  grade?: number;
  isStudent: boolean;
  description?: string;
}

export interface ProfessionalBackground {
  _id: string;
  jobTitle: string;
  companyName: string;
  employmentType: string;
  location: { country: string; city: string };
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface ProfessionalBackgroundDto {
  jobTitle: string;
  companyName: string;
  employmentType: string;
  location: { country: string; city: string };
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface StrapiOption {
  id: number;
  name: string;
  /** Strapi slug (institutions only) — used for campus cascade (web uses slug, not id) */
  slug?: string;
}

// ─── Strapi name enrichment (mirrors web getAssignedInstitutions/getAssignedPrograms) ──

interface StrapiData<T> { data: T[] }

/** Fetch institution names for a list of numeric Strapi IDs. */
async function getAssignedInstitutions(
  ids: number[],
  locale: "en" | "ar"
): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map();
  const params = new URLSearchParams();
  params.append("status", "draft");
  params.append("locale", locale);
  ids.forEach((id, index) => {
    params.append(`filters[id][$in][${index}]`, String(id));
  });
  try {
    const res = await http.get<StrapiData<{ id: number; name?: string }>>(
      `/api/instituitions?${params.toString()}`
    );
    const map = new Map<number, string>();
    (res.data?.data ?? []).forEach((item) => {
      if (item.name) map.set(item.id, item.name);
    });
    return map;
  } catch {
    return new Map();
  }
}

/** Fetch program names for a list of numeric Strapi IDs. */
async function getAssignedPrograms(
  ids: number[],
  locale: "en" | "ar"
): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map();
  const params = new URLSearchParams();
  params.append("status", "draft");
  params.append("locale", locale);
  ids.forEach((id, index) => {
    params.append(`filters[id][$in][${index}]`, String(id));
  });
  try {
    const res = await http.get<StrapiData<{ id: number; name?: string }>>(
      `/api/programs?${params.toString()}`
    );
    const map = new Map<number, string>();
    (res.data?.data ?? []).forEach((item) => {
      if (item.name) map.set(item.id, item.name);
    });
    return map;
  } catch {
    return new Map();
  }
}

// ─── Node API calls ───────────────────────────────────────────────────────────

export const academicApi = {
  /**
   * GET /academic-backgrounds/user/:userId — user's academic backgrounds.
   * userId is the Auth0 sub (e.g. "auth0|abc123").
   * Enriches results with institution + program names from Strapi.
   */
  async getAcademicBackgrounds(
    userId: string,
    locale: "en" | "ar" = "en"
  ): Promise<AcademicBackground[]> {
    const res = await nodeApi.get<{ data: AcademicBackgroundRaw[] }>(
      `/academic-backgrounds/user/${encodeURIComponent(userId)}`
    );
    const raw = res.data.data ?? [];
    if (raw.length === 0) return [];

    const universityIds = [...new Set(raw.map((r) => Number(r.university_id)).filter(Boolean))];
    const programIds = [...new Set(raw.map((r) => Number(r.program_id)).filter(Boolean))];

    const [institutionMap, programMap] = await Promise.all([
      getAssignedInstitutions(universityIds, locale),
      getAssignedPrograms(programIds, locale),
    ]);

    return raw.map((r) => ({
      _id: r._id,
      university_id: r.university_id,
      institutionName: institutionMap.get(Number(r.university_id)),
      program_id: r.program_id,
      programName: programMap.get(Number(r.program_id)),
      startDate: r.startDate,
      endDate: r.endDate,
      grade: r.grade,
      isStudent: r.isStudent,
      description: r.description,
    }));
  },

  /** POST /academic-backgrounds */
  async addAcademicBackground(dto: AcademicBackgroundDto): Promise<AcademicBackgroundRaw> {
    const res = await nodeApi.post<{ data: AcademicBackgroundRaw }>("/academic-backgrounds", dto);
    return res.data.data;
  },

  /** PUT /academic-backgrounds/:id */
  async updateAcademicBackground(id: string, dto: AcademicBackgroundDto): Promise<AcademicBackgroundRaw> {
    const res = await nodeApi.put<{ data: AcademicBackgroundRaw }>(`/academic-backgrounds/${id}`, dto);
    return res.data.data;
  },

  /** DELETE /academic-backgrounds/:id */
  async deleteAcademicBackground(id: string): Promise<void> {
    await nodeApi.delete(`/academic-backgrounds/${id}`);
  },

  /** GET /professional-backgrounds */
  async getProfessionalBackgrounds(): Promise<ProfessionalBackground[]> {
    const res = await nodeApi.get<{ data: ProfessionalBackground[] }>("/professional-backgrounds");
    return res.data.data ?? [];
  },

  /** POST /professional-backgrounds */
  async addProfessionalBackground(dto: ProfessionalBackgroundDto): Promise<ProfessionalBackground> {
    const res = await nodeApi.post<{ data: ProfessionalBackground }>("/professional-backgrounds", dto);
    return res.data.data;
  },

  /** PUT /professional-backgrounds/:id */
  async updateProfessionalBackground(id: string, dto: ProfessionalBackgroundDto): Promise<ProfessionalBackground> {
    const res = await nodeApi.put<{ data: ProfessionalBackground }>(`/professional-backgrounds/${id}`, dto);
    return res.data.data;
  },

  /** DELETE /professional-backgrounds/:id */
  async deleteProfessionalBackground(id: string): Promise<void> {
    await nodeApi.delete(`/professional-backgrounds/${id}`);
  },
};

// ─── Strapi catalog lookups (institution cascade) ─────────────────────────────

function extractName(item: Record<string, unknown>): string {
  const attrs = item.attributes as Record<string, unknown> | undefined;
  if (attrs) {
    return (attrs.name ?? attrs.title ?? "") as string;
  }
  return ((item.name ?? item.title ?? "") as string);
}

export const catalogApi = {
  /** Get all Strapi institutions as options (includes slug for campus cascade) */
  async getInstitutions(locale: "en" | "ar" = "en"): Promise<StrapiOption[]> {
    const res = await http.get<StrapiData<{ id: number; name?: string; slug?: string; attributes?: { name?: string; slug?: string } }>>(
      "/api/instituitions",
      {
        params: {
          locale,
          "pagination[pageSize]": 200,
          "fields[0]": "name",
          "fields[1]": "slug",
          status: "draft",
        },
      }
    );
    return (res.data.data ?? []).map((item) => ({
      id: item.id,
      name: extractName(item as unknown as Record<string, unknown>),
      slug: item.slug ?? (item.attributes as { slug?: string } | undefined)?.slug,
    }));
  },

  /**
   * Get campuses for an institution (by institution slug, matching the web).
   * Web uses: /api/campuses?filters[instituition][slug]=<slug>
   */
  async getCampusesBySlug(instSlug: string, locale: "en" | "ar" = "en"): Promise<StrapiOption[]> {
    const res = await http.get<StrapiData<{ id: number; name?: string; attributes?: { name?: string } }>>(
      "/api/campuses",
      {
        params: {
          locale,
          "fields[0]": "id",
          "fields[1]": "name",
          "filters[instituition][slug]": instSlug,
          "pagination[pageSize]": 100,
          status: "draft",
        },
      }
    );
    return (res.data.data ?? []).map((item) => ({
      id: item.id,
      name: extractName(item as unknown as Record<string, unknown>),
    }));
  },

  /** Get campuses for an institution by numeric id (fallback / for edit flow) */
  async getCampuses(institutionId: number, locale: "en" | "ar" = "en"): Promise<StrapiOption[]> {
    const res = await http.get<StrapiData<{ id: number; name?: string; attributes?: { name?: string } }>>(
      "/api/campuses",
      {
        params: {
          locale,
          "filters[instituition][id][$eq]": institutionId,
          "pagination[pageSize]": 100,
          "fields[0]": "id",
          "fields[1]": "name",
          status: "draft",
        },
      }
    );
    return (res.data.data ?? []).map((item) => ({
      id: item.id,
      name: extractName(item as unknown as Record<string, unknown>),
    }));
  },

  /**
   * Get academic units (faculties) for a campus.
   * Mirrors: /api/academic-units?filters[campus][id]=<campusId>
   */
  async getFaculties(campusId: number, locale: "en" | "ar" = "en"): Promise<StrapiOption[]> {
    const res = await http.get<StrapiData<{ id: number; name?: string; attributes?: { name?: string } }>>(
      "/api/academic-units",
      {
        params: {
          locale,
          "fields[0]": "id",
          "fields[1]": "name",
          "populate[campus][fields][1]": "id",
          "filters[campus][id]": campusId,
          status: "draft",
        },
      }
    );
    return (res.data.data ?? []).map((item) => ({
      id: item.id,
      name: extractName(item as unknown as Record<string, unknown>),
    }));
  },

  /**
   * Get programs for an academic unit (faculty).
   * Mirrors: /api/programs?filters[academicUnits][id]=<academicId>
   */
  async getProgramsByFaculty(facultyId: number, locale: "en" | "ar" = "en"): Promise<StrapiOption[]> {
    const res = await http.get<StrapiData<{ id: number; name?: string; attributes?: { name?: string } }>>(
      "/api/programs",
      {
        params: {
          locale,
          "fields[0]": "name",
          "filters[academicUnits][id]": facultyId,
          status: "draft",
        },
      }
    );
    return (res.data.data ?? []).map((item) => ({
      id: item.id,
      name: extractName(item as unknown as Record<string, unknown>),
    }));
  },

  /** Get programs for an institution (by numeric id). Legacy / fallback. */
  async getPrograms(institutionId: number, campusId?: number): Promise<StrapiOption[]> {
    const params: Record<string, unknown> = {
      "filters[institution][id][$eq]": institutionId,
      "pagination[pageSize]": 200,
      "fields[0]": "name",
      status: "draft",
    };
    if (campusId) {
      params["filters[campus][id][$eq]"] = campusId;
    }
    const res = await http.get<StrapiData<{ id: number; name?: string; attributes?: { name?: string } }>>(
      "/api/programs",
      { params }
    );
    return (res.data.data ?? []).map((item) => ({
      id: item.id,
      name: extractName(item as unknown as Record<string, unknown>),
    }));
  },
};
