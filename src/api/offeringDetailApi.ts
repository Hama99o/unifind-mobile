/**
 * offeringDetailApi — Strapi transport for a single offering detail page.
 * Backend: Strapi (http, catalog, read-only).
 * Transport only — no multi-step logic.
 *
 * Endpoint: GET /api/offerings?filters[slug][$eq]=<slug>&populate=...&status=draft
 */

import { http } from "@/api/http";
import type {
  StrapiOffering,
  StrapiOfferingLocation,
} from "@/api/offeringsApi";

// ─── Extended Strapi Offering for detail ──────────────────────────────────────

export interface StrapiOfferingDetail extends StrapiOffering {
  location?: StrapiOfferingLocation;
}

// ─── Strapi populate builder ──────────────────────────────────────────────────

function buildDetailQuery(filter: { slug: string } | { documentId: string; locale: "ar" }): string {
  const params = new URLSearchParams();
  if ("slug" in filter) {
    params.append("filters[slug][$eq]", filter.slug);
  } else {
    params.append("filters[documentId][$eq]", filter.documentId);
    params.append("filters[locale][$eq]", filter.locale);
  }
  params.append("status", "draft");

  const fields = [
    "id", "documentId", "title", "description", "slug",
    "featured", "order", "availableOnline", "hasCertificate",
  ];
  fields.forEach((f, i) => params.append(`fields[${i}]`, f));

  // category
  params.append("populate[category][fields][0]", "name");
  params.append("populate[category][fields][1]", "icon");

  // degreeLevel
  params.append("populate[degreeLevel][fields][0]", "title");
  params.append("populate[degreeLevel][fields][1]", "informationalText");

  // offeringInfo
  params.append("populate[offeringInfo][fields][0]", "url");
  params.append("populate[offeringInfo][fields][1]", "info");
  params.append("populate[offeringInfo][populate][type][fields][0]", "type");
  params.append("populate[offeringInfo][populate][type][fields][1]", "icon");
  params.append("populate[offeringInfo][populate][type][fields][2]", "iconPrefix");

  // requirements
  params.append("populate[requirements][fields][0]", "title");
  params.append("populate[requirements][fields][1]", "url");
  params.append("populate[requirements][fields][2]", "info");
  params.append("populate[requirements][fields][3]", "icon");

  // results
  params.append("populate[results][fields][0]", "title");
  params.append("populate[results][fields][1]", "url");
  params.append("populate[results][fields][2]", "info");
  params.append("populate[results][fields][3]", "icon");

  // image
  params.append("populate[image][fields][0]", "url");

  // location
  params.append("populate[location][fields][0]", "street");
  params.append("populate[location][populate][city][fields][0]", "name");
  params.append("populate[location][populate][country][fields][0]", "name");
  params.append("populate[location][populate][region][fields][0]", "region");
  params.append("populate[location][populate][district][fields][0]", "governorate");

  // tags
  params.append("populate[tags][fields][0]", "name");
  params.append("populate[tags][fields][1]", "description");

  return `/api/offerings?${params.toString()}`;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const offeringDetailApi = {
  /**
   * Fetch a single offering by slug from Strapi.
   * Returns null if not found.
   */
  async getBySlug(slug: string, locale: "en" | "ar" = "en"): Promise<StrapiOfferingDetail | null> {
    try {
      const res = await http.get<{ data: StrapiOfferingDetail[] }>(buildDetailQuery({ slug }));
      const item = (res.data?.data ?? [])[0] ?? null;
      if (!item || locale === "en" || !item.documentId) return item;

      // Slugs (and Node) are keyed on the EN entry; Strapi 5 stores the AR
      // translation as a separate entry sharing the documentId (QA BUG-03).
      // Keep the EN id so Node/favorites keep matching; fall back to EN content.
      try {
        const arRes = await http.get<{ data: StrapiOfferingDetail[] }>(
          buildDetailQuery({ documentId: item.documentId, locale: "ar" })
        );
        const tr = (arRes.data?.data ?? [])[0];
        return tr ? { ...tr, id: item.id, slug: item.slug } : item;
      } catch {
        return item;
      }
    } catch {
      return null;
    }
  },
};
