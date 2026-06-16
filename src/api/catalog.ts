/**
 * catalog.ts — Strapi CMS catalog transport layer (read-only).
 * All calls use the `http` instance (Strapi + Bearer).
 * No multi-step logic — that belongs in src/services/.
 */

import { http } from "@/api/http";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string;
}

export interface FeaturedInstitution {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  about: unknown; // Strapi rich-text blocks — use extractPlainText
  photoCoverUrl: string;
  logoUrl: string;
  mainLocation: { street: string; cityName: string };
}

export interface FeaturedOffering {
  id: number;
  documentId: string;
  slug: string;
  title: string;
  description: unknown; // Strapi rich-text blocks
  imageUrl: string;
  category: { name: string; icon: string } | null;
}

export interface InstitutionSayItem {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  photoCoverUrl: string;
  logoUrl: string;
}

export interface ProgramSayItem {
  documentId: string;
  name: string;
}

export interface OfferingSayItem {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  imageUrl: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Shared Strapi raw data item shape. Exported for catalog.say.ts. */
export interface StrapiRawItem {
  id: number;
  documentId: string;
  [key: string]: unknown;
}

/** Extract plain text from Strapi rich-text blocks (paragraph + text nodes). */
export function extractPlainText(blocks: unknown): string {
  if (!blocks || !Array.isArray(blocks)) return "";
  return (blocks as Array<{ type: string; children?: Array<{ text?: string }> }>)
    .filter((b) => b.type === "paragraph")
    .flatMap((b) => b.children ?? [])
    .map((c) => c.text ?? "")
    .join(" ")
    .trim();
}

// ─── FindBar dropdown options ─────────────────────────────────────────────────

/**
 * Distinct degree levels used in programs.
 * Endpoint: api/programs/distinct-degrees-programs
 */
export async function fetchDegreeLevels(locale: "en" | "ar"): Promise<SelectOption[]> {
  const res = await http.get<Array<{ degree?: { title?: string } }>>(
    `api/programs/distinct-degrees-programs?status=draft&locale=${locale}`
  );
  const raw: Array<{ degree?: { title?: string } }> = res.data ?? [];
  const seen = new Set<string>();
  const result: SelectOption[] = [];
  for (const item of raw) {
    const label = item.degree?.title ?? "";
    if (label && !seen.has(label)) {
      seen.add(label);
      result.push({ label, value: label });
    }
  }
  return result;
}

/**
 * Fields of study used in programs (for program/institution FindBar).
 * Endpoint: api/programs/fields-program-ids
 */
export async function fetchProgramFields(locale: "en" | "ar"): Promise<SelectOption[]> {
  const res = await http.get<Array<{ fieldOfStudy?: { name?: string } }>>(
    `api/programs/fields-program-ids?status=draft&locale=${locale}`
  );
  const raw: Array<{ fieldOfStudy?: { name?: string } }> = res.data ?? [];
  const seen = new Set<string>();
  const result: SelectOption[] = [];
  for (const item of raw) {
    const label = item.fieldOfStudy?.name ?? "";
    if (label && !seen.has(label)) {
      seen.add(label);
      result.push({ label, value: label });
    }
  }
  return result.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Locations derived from program campuses (city-level, unique).
 * Endpoint: api/programs/... with campus.location populate
 * Uses the same getProgramsLocations pattern from the web's API.service.
 */
export async function fetchProgramLocations(locale: "en" | "ar"): Promise<SelectOption[]> {
  const params = new URLSearchParams({
    "filters[locale][$eq]": locale,
    "fields[0]": "id",
    "populate[campus][populate][location][populate][city][fields][0]": "name",
    "populate[campus][populate][location][populate][district][fields][0]": "governorate",
    "pagination[pageSize]": "1000",
    "status": "draft",
  });
  const res = await http.get<{ data: StrapiRawItem[] }>(`/api/programs?${params.toString()}`);
  const programs = res.data?.data ?? [];
  const uniqueMap = new Map<string, SelectOption>();
  for (const prog of programs) {
    const campuses = (prog.campus as Array<{ location?: { city?: { name?: string }; district?: { governorate?: string } } }>) ?? [];
    for (const campus of campuses) {
      const cityName = campus.location?.city?.name;
      if (!cityName || uniqueMap.has(cityName)) continue;
      uniqueMap.set(cityName, { label: cityName, value: cityName });
    }
  }
  return Array.from(uniqueMap.values());
}

/**
 * Institution campus locations (city + governorate pairs).
 * Endpoint: api/campuses with location.city + location.district
 */
export interface InstitutionLocationOption extends SelectOption {
  parent: string; // governorate
}

export async function fetchInstitutionLocations(locale: "en" | "ar"): Promise<InstitutionLocationOption[]> {
  const params = new URLSearchParams({
    "filters[locale][$eq]": locale,
    "fields[0]": "id",
    "populate[location][populate][city][fields][0]": "name",
    "populate[location][populate][district][fields][0]": "governorate",
    "populate[instituition][fields][0]": "id",
    "pagination[pageSize]": "1000",
    "status": "draft",
  });
  const res = await http.get<{ data: StrapiRawItem[] }>(`/api/campuses?${params.toString()}`);
  const campuses = res.data?.data ?? [];
  const uniqueMap = new Map<string, InstitutionLocationOption>();
  for (const campus of campuses) {
    const loc = campus.location as { city?: { name?: string }; district?: { governorate?: string } } | undefined;
    const cityName = loc?.city?.name ?? "";
    const gov = loc?.district?.governorate ?? "";
    if (!cityName) continue;
    const key = `${gov},${cityName}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, { label: cityName, value: key, parent: gov });
    }
  }
  return Array.from(uniqueMap.values());
}

/**
 * Offering fields (field-usage endpoint).
 * Endpoint: api/offerings/field-usage
 */
export async function fetchOfferingFields(locale: "en" | "ar"): Promise<SelectOption[]> {
  const res = await http.get<Array<{ field?: { name?: string } }>>(
    `/api/offerings/field-usage?status=draft&locale=${locale}`
  );
  const raw: Array<{ field?: { name?: string } }> = res.data ?? [];
  const seen = new Set<string>();
  const result: SelectOption[] = [];
  for (const item of raw) {
    const label = item.field?.name ?? "";
    if (label && !seen.has(label)) {
      seen.add(label);
      result.push({ label, value: label });
    }
  }
  return result.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Offering categories (category-usage endpoint).
 * Endpoint: api/offerings/category-usage
 */
export async function fetchOfferingCategories(locale: "en" | "ar"): Promise<SelectOption[]> {
  const res = await http.get<Array<{ category?: { name?: string } }>>(
    `/api/offerings/category-usage?status=draft&locale=${locale}`
  );
  const raw: Array<{ category?: { name?: string } }> = res.data ?? [];
  const seen = new Set<string>();
  const result: SelectOption[] = [];
  for (const item of raw) {
    const label = item.category?.name ?? "";
    if (label && !seen.has(label)) {
      seen.add(label);
      result.push({ label, value: label });
    }
  }
  return result.sort((a, b) => a.label.localeCompare(b.label));
}

// ─── Featured sections ────────────────────────────────────────────────────────

/**
 * Featured institutions (for home carousel).
 * Filters: featured=true, sort: order:asc,name:asc, pageSize: 6
 */
export async function fetchFeaturedInstitutions(locale: "en" | "ar"): Promise<FeaturedInstitution[]> {
  const params = new URLSearchParams({
    "filters[locale][$eq]": locale,
    "filters[featured][$eq]": "true",
    "fields[0]": "id",
    "fields[1]": "documentId",
    "fields[2]": "name",
    "fields[3]": "slug",
    "fields[4]": "about",
    "populate[logo][fields][0]": "url",
    "populate[photoCover][fields][0]": "url",
    "populate[mainLocation][fields][0]": "street",
    "populate[mainLocation][populate][city][fields][0]": "name",
    "sort[0]": "order:asc",
    "sort[1]": "name:asc",
    "pagination[pageSize]": "6",
    "status": "draft",
  });
  const res = await http.get<{ data: StrapiRawItem[] }>(`/api/instituitions?${params.toString()}`);
  const data = res.data?.data ?? [];
  return data.map((item) => ({
    id: item.id,
    documentId: item.documentId,
    name: (item.name as string) ?? "",
    slug: (item.slug as string) ?? "",
    about: item.about,
    photoCoverUrl: ((item.photoCover as { url?: string } | null)?.url) ?? "",
    logoUrl: ((item.logo as { url?: string } | null)?.url) ?? "",
    mainLocation: {
      street: ((item.mainLocation as { street?: string } | null)?.street) ?? "",
      cityName: (((item.mainLocation as { city?: { name?: string } } | null)?.city?.name) ?? ""),
    },
  }));
}

/**
 * Featured offerings (for home carousel).
 * Filters: featured=true, sort: order:asc, pageSize: 5
 */
export async function fetchFeaturedOfferings(locale: "en" | "ar"): Promise<FeaturedOffering[]> {
  const params = new URLSearchParams({
    "filters[locale][$eq]": locale,
    "filters[featured][$eq]": "true",
    "fields[0]": "id",
    "fields[1]": "documentId",
    "fields[2]": "slug",
    "fields[3]": "title",
    "fields[4]": "description",
    "populate[image][fields][0]": "url",
    "populate[category][fields][0]": "name",
    "populate[category][fields][1]": "icon",
    "sort[0]": "order:asc",
    "pagination[pageSize]": "5",
    "status": "draft",
  });
  const res = await http.get<{ data: StrapiRawItem[] }>(`/api/offerings?${params.toString()}`);
  const data = res.data?.data ?? [];
  return data.map((item) => ({
    id: item.id,
    documentId: item.documentId,
    slug: (item.slug as string) ?? "",
    title: (item.title as string) ?? "",
    description: item.description,
    imageUrl: ((item.image as { url?: string } | null)?.url) ?? "",
    category: item.category
      ? {
          name: ((item.category as { name?: string }).name) ?? "",
          icon: ((item.category as { icon?: string }).icon) ?? "",
        }
      : null,
  }));
}

// Testimonials join functions are in catalog.say.ts (split for line-count)
