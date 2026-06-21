/**
 * catalogItemsApi — Strapi CMS reads for Programs, Institutions, Offerings
 * used by the Favorites and Comparisons profile tabs.
 *
 * All calls via `http` (Strapi Bearer). No user-data / Auth0 here.
 */

import { http } from "@/api/http";
import { extractPlainText } from "@/api/catalog";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogProgram {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  about: unknown;
  degree?: { title: string; informationalText?: string };
  department?: string;
  nbOfYears?: { min: number; max: number };
  nbOfCredits?: { min: number; max: number };
  languages: Array<{ language: string }>;
  campus: Array<{
    location?: {
      city?: { name: string };
      district?: { governorate: string };
    };
  }>;
  institution?: {
    id: number;
    name: string;
    slug: string;
    logo?: { url: string };
    tuition?: Array<{ minTuition: number; maxTuition: number; degree?: { title: string } }>;
  };
  programInfo?: Array<{ type: { type: string; icon?: string; iconPrefix?: string }; info: string }>;
  requirements?: Array<{ title: string; info: string; icon?: string }>;
  specialisations?: Array<{ name: string; studyField?: { name: string } }>;
}

export interface CatalogInstitution {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  acronym?: string;
  type?: string;
  about: unknown;
  foundationYear?: number;
  website?: string;
  email?: string;
  phone?: string;
  logo?: { url: string };
  photoCover?: { url: string };
  mainLocation?: {
    city?: { name: string };
    country?: { name: string };
  };
  tuition?: Array<{ minTuition: number; maxTuition: number; degree?: { title: string } }>;
  ranking?: Array<{
    position?: number;
    name?: string;
    organizations?: Array<{ rankingCategory?: string }>;
  }>;
  tags?: Array<{ name: string }>;
  institutionInfo?: Array<{ type: { type: string; icon?: string; iconPrefix?: string }; info: string }>;
}

export interface CatalogOffering {
  id: number;
  documentId: string;
  slug: string;
  title: string;
  description: unknown;
  price?: number;
  duration?: number;
  location?: { city?: { name: string } };
  languages?: Array<{ language: string }>;
  image?: { url: string };
  availableOnline?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInFilter(ids: string[]): string {
  return ids.map((id, i) => `filters[id][$in][${i}]=${encodeURIComponent(id)}`).join("&");
}

function buildDocumentIdInFilter(ids: string[]): string {
  return ids.map((id, i) => `filters[documentId][$in][${i}]=${encodeURIComponent(id)}`).join("&");
}

const PROGRAM_POPULATE = [
  "populate[degree][fields][0]=title",
  "populate[degree][fields][1]=informationalText",
  "populate[institution][fields][0]=id",
  "populate[institution][fields][1]=name",
  "populate[institution][fields][2]=slug",
  "populate[institution][populate][logo][fields][0]=url",
  "populate[institution][populate][tuition][fields][0]=minTuition",
  "populate[institution][populate][tuition][fields][1]=maxTuition",
  "populate[institution][populate][tuition][populate][degree][fields][0]=title",
  "populate[campus][populate][location][populate][city][fields][0]=name",
  "populate[campus][populate][location][populate][district][fields][0]=governorate",
  "populate[languages][fields][0]=language",
  "populate[programInfo][populate][type][fields][0]=type",
  "populate[programInfo][populate][type][fields][1]=icon",
  "populate[programInfo][populate][type][fields][2]=iconPrefix",
  "populate[requirements][fields][0]=title",
  "populate[requirements][fields][1]=info",
  "populate[requirements][fields][2]=icon",
  "populate[specialisations][fields][0]=name",
  "fields[0]=id",
  "fields[1]=documentId",
  "fields[2]=slug",
  "fields[3]=name",
  "fields[4]=about",
  "fields[5]=department",
  "fields[6]=nbOfYears",
  "fields[7]=nbOfCredits",
  "status=draft",
].join("&");

const INSTITUTION_POPULATE = [
  "populate[logo][fields][0]=url",
  "populate[photoCover][fields][0]=url",
  "populate[mainLocation][populate][city][fields][0]=name",
  "populate[mainLocation][populate][country][fields][0]=name",
  "populate[tuition][fields][0]=minTuition",
  "populate[tuition][fields][1]=maxTuition",
  "populate[tuition][populate][degree][fields][0]=title",
  "populate[ranking][fields][0]=position",
  "populate[ranking][fields][1]=name",
  "populate[ranking][populate][organizations][fields][0]=rankingCategory",
  "populate[tags][fields][0]=name",
  "populate[institutionInfo][populate][type][fields][0]=type",
  "populate[institutionInfo][populate][type][fields][1]=icon",
  "populate[institutionInfo][populate][type][fields][2]=iconPrefix",
  "fields[0]=id",
  "fields[1]=documentId",
  "fields[2]=slug",
  "fields[3]=name",
  "fields[4]=acronym",
  "fields[5]=type",
  "fields[6]=about",
  "fields[7]=foundationYear",
  "fields[8]=website",
  "fields[9]=email",
  "fields[10]=phone",
  "status=draft",
].join("&");

const OFFERING_POPULATE = [
  "populate[image][fields][0]=url",
  "populate[location][populate][city][fields][0]=name",
  // No populate[languages]: offerings have no `languages` relation — including
  // it makes Strapi 400 "Invalid key languages" (breaks featured/compare/list).
  "fields[0]=id",
  "fields[1]=documentId",
  "fields[2]=slug",
  "fields[3]=title",
  "fields[4]=description",
  "fields[5]=price",
  "fields[6]=duration",
  "fields[7]=availableOnline",
  "status=draft",
].join("&");

// ─── API calls ────────────────────────────────────────────────────────────────

export const catalogItemsApi = {
  /** Fetch programs by documentId list (used by favorites) */
  async getProgramsByDocumentIds(
    documentIds: string[],
    locale: "en" | "ar"
  ): Promise<CatalogProgram[]> {
    if (!documentIds.length) return [];
    const filter = buildDocumentIdInFilter(documentIds);
    const res = await http.get<{ data: CatalogProgram[] }>(
      `/api/programs?${filter}&${PROGRAM_POPULATE}&filters[locale][$eq]=${locale}&pagination[pageSize]=50`
    );
    return res.data?.data ?? [];
  },

  /** Fetch programs by numeric id list (used by comparisons) */
  async getProgramsByIds(
    ids: string[],
    locale: "en" | "ar"
  ): Promise<CatalogProgram[]> {
    if (!ids.length) return [];
    const filter = buildInFilter(ids);
    const res = await http.get<{ data: CatalogProgram[] }>(
      `/api/programs?${filter}&${PROGRAM_POPULATE}&filters[locale][$eq]=${locale}&pagination[pageSize]=50`
    );
    return res.data?.data ?? [];
  },

  /** Fetch institutions by documentId list (used by favorites) */
  async getInstitutionsByDocumentIds(
    documentIds: string[],
    locale: "en" | "ar"
  ): Promise<CatalogInstitution[]> {
    if (!documentIds.length) return [];
    const filter = buildDocumentIdInFilter(documentIds);
    const res = await http.get<{ data: CatalogInstitution[] }>(
      `/api/instituitions?${filter}&${INSTITUTION_POPULATE}&filters[locale][$eq]=${locale}&pagination[pageSize]=50`
    );
    return res.data?.data ?? [];
  },

  /** Fetch institutions by numeric id list (used by comparisons) */
  async getInstitutionsByIds(
    ids: string[],
    locale: "en" | "ar"
  ): Promise<CatalogInstitution[]> {
    if (!ids.length) return [];
    const filter = buildInFilter(ids);
    const res = await http.get<{ data: CatalogInstitution[] }>(
      `/api/instituitions?${filter}&${INSTITUTION_POPULATE}&filters[locale][$eq]=${locale}&pagination[pageSize]=50`
    );
    return res.data?.data ?? [];
  },

  /** Fetch offerings by numeric id list (used by favorites) */
  async getOfferingsByIds(
    ids: string[],
    locale: "en" | "ar"
  ): Promise<CatalogOffering[]> {
    if (!ids.length) return [];
    const filter = buildInFilter(ids);
    const res = await http.get<{ data: CatalogOffering[] }>(
      `/api/offerings?${filter}&${OFFERING_POPULATE}&filters[locale][$eq]=${locale}&pagination[pageSize]=50`
    );
    return res.data?.data ?? [];
  },

  /** Helper to extract plain text from Strapi rich-text blocks */
  extractDescription(blocks: unknown): string {
    return extractPlainText(blocks);
  },
};
