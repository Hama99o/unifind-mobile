/**
 * institutionDetailApi — Strapi CMS transport for Institution Detail screen.
 * Backend: Strapi (http). All read-only catalog data.
 *
 * Endpoints:
 *   GET /api/instituitions — getInstitutionBySlug (full populate)
 *   GET /api/programs/academic-units-info — getAcademicUnitsInfo (faculties)
 *   GET /api/programs — getProgramsForFaculty (lazy-load per accordion)
 *   GET /api/campuses — getCampusesForInstitution (review form)
 *   GET /api/academic-units — getAcademicUnitsForCampus (review form)
 *   GET /api/programs — getProgramsForReviewDropdown (review form)
 *   GET /api/programs — getInstitutionProgramCount
 */

import { http } from "@/api/http";
import { extractPlainText } from "@/api/catalog";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InstitutionDetailItem {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  acronym?: string;
  about?: unknown; // rich-text blocks
  email?: string;
  phone?: string;
  foundationYear?: number;
  website?: string;
  logo?: { url?: string };
  photoCover?: { url?: string };
  institutionInfo?: Array<{
    id?: number;
    info?: string;
    url?: string;
    type?: { type?: string; icon?: string; iconPrefix?: string };
  }>;
  tuition?: Array<{
    id?: number;
    tuitionType?: string;
    minTuition?: number;
    maxTuition?: number;
    link?: string;
    degree?: { title?: string; documentId?: string };
  }>;
  mainLocation?: {
    street?: string;
    city?: { name?: string };
    country?: { name?: string };
    district?: { governorate?: string };
    region?: { region?: string };
  };
  ranking?: Array<{
    id?: number;
    position?: number;
    year?: number;
    url?: string;
    organizations?: Array<{ rankingCategory?: string }>;
  }>;
  tags?: Array<{ name?: string; description?: string }>;
  localizations?: Array<{ locale?: string; slug?: string }>;
}

export interface AcademicFaculty {
  facultyName: string;
  description?: string;
  campuses: string[];
  degrees: AcademicDegree[];
}

export interface AcademicDegree {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  descProgram?: string;
  campus?: string;
  duration?: string;
  fees?: string;
  language?: string;
  link?: string;
  favorite?: boolean;
}

export interface AcademicData {
  Bachelors: AcademicFaculty[];
  Masters: AcademicFaculty[];
  PhD: AcademicFaculty[];
  Others: AcademicFaculty[];
}

export interface ProgramForFaculty {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  department?: string;
  degree?: { title?: string };
  programInfo?: Array<{
    info?: string;
    url?: string;
    type?: { type?: string };
  }>;
  campus?: { name?: string };
  languages?: Array<{ language?: string }>;
  nbOfCredits?: { info?: string };
  nbOfYears?: { min?: number; max?: number; info?: string };
  institution?: {
    slug?: string;
    tuition?: Array<{ minTuition?: number; maxTuition?: number }>;
  };
  academicUnits?: Array<{ name?: string }>;
}

export interface CampusOption {
  id: number;
  documentId?: string;
  name: string;
}

export interface FacultyOption {
  id: number;
  documentId?: string;
  name: string;
}

export interface ProgramReviewOption {
  documentId: string;
  label: string;
}

// ─── Degree title maps (mirrors web UFAcademicSection) ───────────────────────

const DEGREE_TITLE_MAP: Record<string, string[]> = {
  Bachelors: [
    "Bachelors",
    "Bachelor's / Licence",
    "Bachelor of Engineering",
    "Bachelor's of Architecture",
    "بكالوريوس",
    "بكالوريوس / إجازة",
    "بكالوريوس في الهندسة",
    "بكالوريوس في الهندسة المعمارية",
  ],
  Masters: ["Masters", "Master's", "ماجستير"],
  PhD: ["Doctorate phd", "Ph.D.", "Ph.d.", "دكتوراه"],
};

const ALL_DEGREE_TITLES = [
  ...DEGREE_TITLE_MAP.Bachelors,
  ...DEGREE_TITLE_MAP.Masters,
  ...DEGREE_TITLE_MAP.PhD,
];

// ─── Helper: map raw Strapi programs → AcademicData ─────────────────────────

/** A degree arrives as a plain string (real endpoint) or as { title } (older shape). */
function degreeTitleOf(d: unknown): string {
  if (typeof d === "string") return d;
  if (d && typeof (d as { title?: unknown }).title === "string") return (d as { title: string }).title;
  return "";
}

function tabForDegree(title: string): keyof AcademicData {
  const lower = title.toLowerCase();
  for (const [tab, titles] of Object.entries(DEGREE_TITLE_MAP)) {
    if (titles.some((v) => lower.includes(v.toLowerCase()))) return tab as keyof AcademicData;
  }
  return "Others";
}

/**
 * Group faculties into the degree tabs. /api/programs/academic-units-info returns
 * `degrees` as strings (e.g. ["Bachelor's / Licence", "Master's"]) and `about` as
 * rich-text blocks. A faculty is listed under EVERY tab one of its degrees maps to
 * (QA 2026-11-10: string degrees were all dumped into "Others", whose filter then
 * excluded every program, and `about` rendered as "[object Object]").
 */
function mapProgramsToFacultyCampuses(data: unknown): AcademicData {
  const result: AcademicData = { Bachelors: [], Masters: [], PhD: [], Others: [] };
  if (!Array.isArray(data)) return result;

  for (const faculty of data) {
    const rawDegrees: unknown[] = Array.isArray(faculty.degrees) ? faculty.degrees : [];
    const rawDescription = faculty.description || faculty.about || "";
    const entry: AcademicFaculty = {
      facultyName: faculty.facultyName || faculty.name || "-",
      description: typeof rawDescription === "string" ? rawDescription : extractPlainText(rawDescription),
      campuses: Array.isArray(faculty.campuses) ? faculty.campuses : [],
      degrees: rawDegrees.map((d) =>
        typeof d === "string" ? ({ id: 0, documentId: "", title: d } as AcademicDegree) : (d as AcademicDegree)
      ),
    };

    const tabs = new Set<keyof AcademicData>();
    for (const d of rawDegrees) {
      const title = degreeTitleOf(d);
      if (title) tabs.add(tabForDegree(title));
    }
    if (tabs.size === 0) tabs.add("Others");
    for (const tab of ["Bachelors", "Masters", "PhD", "Others"] as const) {
      if (tabs.has(tab)) result[tab].push(entry);
    }
  }

  return result;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const institutionDetailApi = {
  /**
   * GET /api/instituitions?filters[slug][$eq]=&filters[locale][$eq]=
   * Full populate for the detail page.
   */
  async getInstitutionBySlug(
    slug: string,
    locale: "en" | "ar"
  ): Promise<InstitutionDetailItem | null> {
    const qp = new URLSearchParams();
    qp.append("filters[slug][$eq]", slug);
    qp.append("filters[locale][$eq]", locale);
    qp.append("status", "draft");

    // Fields
    const fields = [
      "id", "documentId", "name", "slug", "acronym", "about",
      "email", "phone", "foundationYear", "website",
    ];
    fields.forEach((f, i) => qp.append(`fields[${i}]`, f));

    // Populate
    qp.append("populate[logo][fields][0]", "url");
    qp.append("populate[photoCover][fields][0]", "url");
    qp.append("populate[institutionInfo][fields][0]", "info");
    qp.append("populate[institutionInfo][fields][1]", "url");
    qp.append("populate[institutionInfo][populate][type][fields][0]", "type");
    qp.append("populate[institutionInfo][populate][type][fields][1]", "icon");
    qp.append("populate[institutionInfo][populate][type][fields][2]", "iconPrefix");
    qp.append("populate[tuition][fields][0]", "tuitionType");
    qp.append("populate[tuition][fields][1]", "minTuition");
    qp.append("populate[tuition][fields][2]", "maxTuition");
    // NOTE: tuition has NO `link` field — populating it makes Strapi 400
    // "Invalid key link", which made getInstitutionBySlug throw → the whole
    // institution detail page showed "Not found". (Removed; query now 200s.)
    qp.append("populate[tuition][populate][degree][fields][0]", "title");
    qp.append("populate[tuition][populate][degree][fields][1]", "documentId");
    qp.append("populate[mainLocation][fields][0]", "street");
    qp.append("populate[mainLocation][populate][city][fields][0]", "name");
    qp.append("populate[mainLocation][populate][country][fields][0]", "name");
    qp.append("populate[mainLocation][populate][district][fields][0]", "governorate");
    qp.append("populate[mainLocation][populate][region][fields][0]", "region");
    qp.append("populate[ranking][fields][0]", "position");
    qp.append("populate[ranking][fields][1]", "year");
    qp.append("populate[ranking][fields][2]", "url");
    qp.append("populate[ranking][populate][organizations][fields][0]", "rankingCategory");
    qp.append("populate[tags][fields][0]", "name");
    qp.append("populate[tags][fields][1]", "description");
    qp.append("populate[localizations][fields][0]", "locale");
    qp.append("populate[localizations][fields][1]", "slug");

    const res = await http.get<{
      data: InstitutionDetailItem[];
    }>(`/api/instituitions?${qp.toString()}`);

    return res.data?.data?.[0] ?? null;
  },

  /**
   * GET /api/programs/academic-units-info?slug=&status=draft&locale=
   * Returns faculties with their campuses and degree tabs.
   */
  async getAcademicUnitsInfo(
    slug: string,
    locale: "en" | "ar"
  ): Promise<AcademicData> {
    try {
      const res = await http.get<unknown>(
        `/api/programs/academic-units-info?slug=${encodeURIComponent(slug)}&status=draft&locale=${locale}`
      );
      return mapProgramsToFacultyCampuses(res.data);
    } catch {
      return { Bachelors: [], Masters: [], PhD: [], Others: [] };
    }
  },

  /**
   * GET /api/programs — filtered by institution slug, faculty name, degree titles.
   * Used for lazy-loading when an accordion opens.
   */
  async getProgramsForFaculty(
    slug: string,
    facultyName: string,
    degreeTitles: string[],
    locale: "en" | "ar",
    notIn?: boolean
  ): Promise<ProgramForFaculty[]> {
    const qp = new URLSearchParams();
    qp.append("filters[locale][$eq]", locale);
    qp.append("status", "draft");
    qp.append("filters[institution][slug]", slug);
    qp.append("filters[academicUnits][name]", facultyName);

    if (degreeTitles.length === 0 || notIn) {
      const excludedTitles = ALL_DEGREE_TITLES;
      excludedTitles.forEach((title, index) => {
        qp.append(`filters[degree][title][$notIn][${index}]`, title);
      });
    } else {
      degreeTitles.forEach((title, index) => {
        qp.append(`filters[degree][title][$in][${index}]`, title);
      });
    }

    // Fields
    qp.append("fields[0]", "id");
    qp.append("fields[1]", "name");
    qp.append("fields[2]", "slug");
    qp.append("fields[3]", "department");

    // Populate
    qp.append("populate[degree][fields][0]", "title");
    qp.append("populate[programInfo][fields][0]", "info");
    qp.append("populate[programInfo][fields][1]", "url");
    qp.append("populate[programInfo][populate][type][fields][0]", "type");
    qp.append("populate[institution][fields][0]", "slug");
    qp.append("populate[institution][populate][tuition][fields][0]", "minTuition");
    qp.append("populate[institution][populate][tuition][fields][1]", "maxTuition");
    qp.append("populate[campus][fields][0]", "name");
    qp.append("populate[languages][fields][0]", "language");
    qp.append("populate[nbOfCredits][fields][0]", "info");
    qp.append("populate[nbOfYears][fields][0]", "min");
    qp.append("populate[nbOfYears][fields][1]", "max");
    qp.append("populate[nbOfYears][fields][2]", "info");
    qp.append("populate[academicUnits][fields][0]", "name");
    qp.append("pagination[pageSize]", "100");

    const res = await http.get<{ data: ProgramForFaculty[] }>(
      `/api/programs?${qp.toString()}`
    );
    return res.data?.data ?? [];
  },

  /** GET /api/programs — total count for an institution */
  async getInstitutionProgramCount(slug: string, locale: "en" | "ar"): Promise<number> {
    try {
      const res = await http.get<{ meta: { pagination: { total: number } } }>(
        `/api/programs?locale=${locale}&filters[institution][slug][$eq]=${slug}&fields[0]=id&pagination[page]=1&pagination[pageSize]=1&status=draft`
      );
      return res.data?.meta?.pagination?.total ?? 0;
    } catch {
      return 0;
    }
  },

  /** GET /api/campuses — campuses for the institution (review form cascade) */
  async getCampusesForInstitution(
    instSlug: string,
    locale: "en" | "ar"
  ): Promise<CampusOption[]> {
    try {
      const res = await http.get<{ data: Array<{ id: number; documentId?: string; name?: string }> }>(
        `/api/campuses?locale=${locale}&fields[0]=id&fields[1]=name&fields[2]=documentId&populate[instituition][fields][0]=slug&filters[instituition][slug]=${instSlug}&status=draft&pagination[pageSize]=100`
      );
      return (res.data?.data ?? []).map((c) => ({
        id: c.id,
        documentId: c.documentId,
        name: c.name ?? "",
      }));
    } catch {
      return [];
    }
  },

  /** GET /api/academic-units — faculties for a campus (review form cascade) */
  async getAcademicUnitsForCampus(
    campusId: number,
    locale: "en" | "ar"
  ): Promise<FacultyOption[]> {
    try {
      const res = await http.get<{
        data: Array<{ id: number; documentId?: string; name?: string }>;
      }>(
        `/api/academic-units?locale=${locale}&fields[0]=id&fields[1]=name&fields[2]=documentId&populate[campus][fields][0]=id&filters[campus][id]=${campusId}&status=draft&pagination[pageSize]=100`
      );
      return (res.data?.data ?? []).map((f) => ({
        id: f.id,
        documentId: f.documentId,
        name: f.name ?? "",
      }));
    } catch {
      return [];
    }
  },

  /** GET /api/programs — programs for a faculty (review form cascade) */
  async getProgramsForReviewDropdown(
    academicId: number,
    locale: "en" | "ar"
  ): Promise<ProgramReviewOption[]> {
    try {
      const res = await http.get<{
        data: Array<{
          id: number;
          documentId: string;
          name?: string;
          degree?: { title?: string };
        }>;
      }>(
        `/api/programs?filters[locale][$eq]=${locale}&fields[0]=name&fields[1]=documentId&populate[degree][fields][0]=title&filters[academicUnits][id]=${academicId}&status=draft&pagination[pageSize]=100`
      );
      return (res.data?.data ?? []).map((p) => ({
        documentId: p.documentId,
        // Use a locale-neutral separator — callers format the label if needed
        label: p.degree?.title ? `${p.degree.title} — ${p.name ?? ""}` : (p.name ?? ""),
      }));
    } catch {
      return [];
    }
  },
};

// ─── Re-export degree title map for use in screens ───────────────────────────

export { DEGREE_TITLE_MAP };
