/**
 * programsApiTypes — shared types, populate config, and helpers for programsApi.
 * Split from programsApi.ts to keep that file under ~300 lines.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgramDegree {
  id?: number;
  title?: string;
  informationalText?: string;
}

export interface ProgramSpecialisation {
  id?: number;
  name?: string;
  studyField?: { id?: number; name?: string };
}

export interface ProgramInfoItem {
  id?: number;
  info?: string;
  url?: string;
  type?: { type?: string; icon?: string; iconPrefix?: string };
}

export interface ProgramRequirement {
  id?: number;
  title?: string;
  info?: string;
  icon?: string;
  url?: string;
}

export interface ProgramAcademicUnit {
  id?: number;
  name?: string;
  acronym?: string;
  slug?: string;
  about?: unknown;
}

export interface ProgramInstitution {
  id?: number;
  documentId?: string;
  name?: string;
  acronym?: string;
  slug?: string;
  logo?: { url?: string };
  photoCover?: { url?: string };
  tuition?: Array<{
    id?: number;
    minTuition?: number;
    maxTuition?: number;
    tuitionType?: string;
    degree?: { title?: string; informationalText?: string };
  }>;
}

export interface ProgramCampusLocation {
  id?: number;
  street?: string;
  coordinates?: { latitude?: number; longitude?: number };
  region?: { region?: string };
  country?: { name?: string };
  city?: { name?: string };
  district?: { governorate?: string };
}

export interface ProgramCampus {
  id?: number;
  name?: string;
  slug?: string;
  about?: unknown;
  location?: ProgramCampusLocation;
}

export interface ProgramNbOfYears {
  min?: number;
  max?: number;
  info?: string;
}

export interface ProgramNbOfCredits {
  min?: number;
  max?: number;
  info?: string;
}

export interface ProgramLanguage {
  id?: number;
  documentId?: string;
  language?: string;
}

export interface ProgramTag {
  id?: number;
  name?: string;
  description?: string;
}

export interface ProgramListItem {
  id: number;
  documentId: string;
  acronym?: string;
  name: string;
  slug: string;
  about?: unknown; // Strapi rich-text blocks → extractPlainText
  department?: string;
  knowMoreURL?: string;
  featured?: boolean;
  degree?: ProgramDegree;
  specialisations?: ProgramSpecialisation[];
  programInfo?: ProgramInfoItem[];
  requirements?: ProgramRequirement[];
  academicUnits?: ProgramAcademicUnit[];
  institution?: ProgramInstitution;
  campus?: ProgramCampus[];
  tags?: ProgramTag[];
  languages?: ProgramLanguage[];
  nbOfCredits?: ProgramNbOfCredits;
  nbOfYears?: ProgramNbOfYears;
}

export interface ProgramsListParams {
  locale: "en" | "ar";
  page: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  /** Dynamic filter params — passed directly as Strapi filter arrays */
  degreeIds?: string[];
  fieldOfStudyIds?: string[];
  locationIds?: string[];
  nbOfYearsMins?: number[];
  nbOfYearsMaxs?: number[];
  languageIds?: string[];
  /** undefined = no tuition constraint; defined = apply [$gte/$lte] */
  tuitionMin?: number;
  tuitionMax?: number;
}

// ─── Shared helper ────────────────────────────────────────────────────────────

/**
 * Re-export addPopulate from the canonical home so callers that already import
 * from programsApiTypes continue to work without changes.
 * M2: the implementation now lives in strapiQuery.ts (single source of truth).
 */
export { addPopulate } from "@/api/strapiQuery";

// ─── Populate config ──────────────────────────────────────────────────────────

/**
 * The list of top-level scalar fields to fetch for each program.
 */
export const PROGRAM_LIST_FIELDS = [
  "id",
  "documentId",
  "acronym",
  "name",
  "slug",
  "about",
  "department",
  "knowMoreURL",
  "featured",
];

/**
 * The nested populate config for programs (mirrors web API.service.tsx).
 */
export const PROGRAM_LIST_POPULATE: Record<string, unknown> = {
  degree: ["title", "informationalText"],
  specialisations: {
    fields: ["name"],
    populate: {
      studyField: { fields: ["name"] },
    },
  },
  programInfo: {
    fields: ["info", "url"],
    populate: {
      type: { fields: ["type", "icon", "iconPrefix"] },
    },
  },
  requirements: ["title", "info", "icon", "url"],
  institution: {
    fields: [
      "documentId",
      "name",
      "acronym",
      "slug",
      "about",
      "email",
      "phone",
      "website",
      "foundationYear",
      "featured",
      "order",
    ],
    populate: {
      logo: { fields: ["url"] },
      photoCover: { fields: ["url"] },
      tuition: {
        fields: ["minTuition", "maxTuition", "tuitionType"],
        populate: {
          degree: { fields: ["title", "informationalText"] },
        },
      },
    },
  },
  campus: {
    fields: ["name", "slug", "about"],
    populate: {
      location: {
        fields: ["street"],
        populate: {
          coordinates: { fields: ["latitude", "longitude"] },
          region: { fields: ["region"] },
          country: { fields: ["name"] },
          city: { fields: ["name"] },
          district: { fields: ["governorate"] },
        },
      },
    },
  },
  tags: ["name", "description"],
  languages: ["language"],
  nbOfCredits: ["min", "max", "info"],
  nbOfYears: ["min", "max", "info"],
};
