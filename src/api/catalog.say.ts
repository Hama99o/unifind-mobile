/**
 * catalog.say.ts — Strapi fetch helpers for testimonial join (say/reviews).
 * Split from catalog.ts to keep files under ~300 lines.
 */

import { http } from "@/api/http";
import type { InstitutionSayItem, ProgramSayItem, OfferingSayItem, StrapiRawItem } from "@/api/catalog";

/** Fetch institutions by documentId $in (for testimonial join). */
export async function fetchInstitutionsByDocumentIds(
  locale: "en" | "ar",
  documentIds: string[]
): Promise<InstitutionSayItem[]> {
  if (!documentIds.length) return [];
  const params = new URLSearchParams({
    "filters[locale][$eq]": locale,
    "fields[0]": "id",
    "fields[1]": "documentId",
    "fields[2]": "name",
    "fields[3]": "slug",
    "populate[logo][fields][0]": "url",
    "populate[photoCover][fields][0]": "url",
    "pagination[pageSize]": "25",
    "status": "draft",
  });
  documentIds.forEach((id, i) => params.append(`filters[documentId][$in][${i}]`, id));
  const res = await http.get<{ data: StrapiRawItem[] }>(`/api/instituitions?${params.toString()}`);
  const data = res.data?.data ?? [];
  return data.map((item) => ({
    id: item.id,
    documentId: item.documentId,
    name: (item.name as string) ?? "",
    slug: (item.slug as string) ?? "",
    photoCoverUrl: ((item.photoCover as { url?: string } | null)?.url) ?? "",
    logoUrl: ((item.logo as { url?: string } | null)?.url) ?? "",
  }));
}

/** Fetch programs by documentId $in (for testimonial join). */
export async function fetchProgramsByDocumentIds(
  locale: "en" | "ar",
  documentIds: string[]
): Promise<ProgramSayItem[]> {
  if (!documentIds.length) return [];
  const params = new URLSearchParams({
    "filters[locale][$eq]": locale,
    "fields[0]": "documentId",
    "fields[1]": "name",
    "pagination[pageSize]": "25",
    "status": "draft",
  });
  documentIds.forEach((id, i) => params.append(`filters[documentId][$in][${i}]`, id));
  const res = await http.get<{ data: StrapiRawItem[] }>(`/api/programs?${params.toString()}`);
  const data = res.data?.data ?? [];
  return data.map((item) => ({
    documentId: item.documentId,
    name: (item.name as string) ?? "",
  }));
}

/** Fetch offerings by numeric id $in (for testimonial join). */
export async function fetchOfferingsByIds(
  locale: "en" | "ar",
  ids: string[]
): Promise<OfferingSayItem[]> {
  if (!ids.length) return [];
  const params = new URLSearchParams({
    "filters[locale][$eq]": locale,
    "fields[0]": "id",
    "fields[1]": "documentId",
    "fields[2]": "title",
    "fields[3]": "slug",
    "populate[image][fields][0]": "url",
    "pagination[pageSize]": "25",
    "status": "draft",
  });
  ids.forEach((id, i) => params.append(`filters[id][$in][${i}]`, id));
  const res = await http.get<{ data: StrapiRawItem[] }>(`/api/offerings?${params.toString()}`);
  const data = res.data?.data ?? [];
  return data.map((item) => ({
    id: item.id,
    documentId: item.documentId,
    title: (item.title as string) ?? "",
    slug: (item.slug as string) ?? "",
    imageUrl: ((item.image as { url?: string } | null)?.url) ?? "",
  }));
}
