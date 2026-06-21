/**
 * offeringsApi — Two-step fetch: Node first, then Strapi, then merge.
 *
 * Step 1 — Node GET /offering?page=<n>&categoryId=<...>&offeringContentId=<...>&price=<min-max>
 *   Returns: { success, data: [{ offeringContentId, slug, sessionDuration, minPrice, maxPrice, eventTypes }], totalPages, totalCount }
 *   Page size: 5 (enforced server-side)
 *
 * Step 2 — Strapi GET /api/offerings?filters[id][$in][i]=<id>&...&status=draft
 *   Returns full Strapi shape with all card fields.
 *
 * Merge: strapiItem.id === nodeItem.offeringContentId. Drop unmatched on either side.
 *
 * Ratings — logged-in only: GET Node /reviews/all-average-rating/Offering/<strapiId>
 *   → averages.averageGeneralRating || 0. Parallel N+1 per page; one failure = 0 (no page break).
 *
 * Backends:
 *   - Node (user data, public but token-attached when logged in): nodeApi
 *   - Strapi (catalog, read-only): http
 */

import { nodeApi } from "@/api/nodeApi";
import { http } from "@/api/http";
import type { Page } from "@/types/page";
import { mergeOfferingsByContentId } from "@/utils/offeringMerge";
import { injectAvgRatings } from "@/utils/ratings";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfferingEventType {
  mode: string;
  effectivePrice: number;
  specialistName: string;
  specialistPhoto: string | null;
}

export interface NodeOffering {
  _id: string;
  offeringContentId: string;
  slug: string;
  sessionDuration?: number;
  minPrice?: number;
  maxPrice?: number;
  eventTypes: OfferingEventType[];
}

export interface StrapiOfferingLocation {
  street?: string;
  coordinates?: { latitude?: number; longitude?: number };
  region?: { region?: string };
  country?: { name?: string };
  city?: { name?: string };
  district?: { governorate?: string };
}

export interface StrapiOffering {
  id: number;
  documentId: string;
  title: string;
  description?: unknown;
  slug?: string;
  featured?: boolean;
  order?: number;
  availableOnline?: boolean;
  hasCertificate?: boolean;
  category?: { name?: string; icon?: string };
  degreeLevel?: { title?: string; informationalText?: string };
  specialisations?: Array<{
    name?: string;
    slug?: string;
    shortDescription?: string;
    description?: unknown;
    studyField?: { name?: string; icon?: string; iconPrefix?: string };
  }>;
  offeringInfo?: Array<{
    url?: string;
    info?: string;
    type?: { type?: string; icon?: string; iconPrefix?: string };
  }>;
  requirements?: Array<{ title?: string; url?: string; info?: string; icon?: string }>;
  results?: Array<{ title?: string; url?: string; info?: string; icon?: string }>;
  image?: { url?: string };
  tags?: Array<{ name?: string; description?: string }>;
  location?: StrapiOfferingLocation;
  languages?: Array<{ language?: string }>;
}

/** The merged offering object exposed to UI. */
export interface MergedOffering extends StrapiOffering {
  nodeData: NodeOffering;
  /** Rating injected after fetch (0 when not logged in or no reviews). */
  ratingStars?: number;
}

interface NodeOfferingsResponse {
  success: boolean;
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  data: NodeOffering[];
}

// ─── Strapi populate builder ───────────────────────────────────────────────────

function buildStrapiQuery(ids: (string | number)[], lang: "en" | "ar"): string {
  const params = new URLSearchParams();
  params.append("filters[locale][$eq]", lang);
  params.append("status", "draft");

  const fields = [
    "id", "documentId", "title", "description", "slug",
    "featured", "order", "availableOnline", "hasCertificate",
  ];
  fields.forEach((f, i) => params.append(`fields[${i}]`, f));

  ids.forEach((id, i) => params.append(`filters[id][$in][${i}]`, String(id)));

  // category
  params.append("populate[category][fields][0]", "name");
  params.append("populate[category][fields][1]", "icon");

  // degreeLevel
  params.append("populate[degreeLevel][fields][0]", "title");
  params.append("populate[degreeLevel][fields][1]", "informationalText");

  // specialisations
  params.append("populate[specialisations][fields][0]", "name");
  params.append("populate[specialisations][fields][1]", "slug");
  params.append("populate[specialisations][fields][2]", "shortDescription");
  params.append("populate[specialisations][fields][3]", "description");
  params.append("populate[specialisations][populate][studyField][fields][0]", "name");
  params.append("populate[specialisations][populate][studyField][fields][1]", "icon");
  params.append("populate[specialisations][populate][studyField][fields][2]", "iconPrefix");

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

  // tags
  params.append("populate[tags][fields][0]", "name");
  params.append("populate[tags][fields][1]", "description");

  // location
  params.append("populate[location][fields][0]", "street");
  params.append("populate[location][populate][coordinates][fields][0]", "latitude");
  params.append("populate[location][populate][coordinates][fields][1]", "longitude");
  params.append("populate[location][populate][region][fields][0]", "region");
  params.append("populate[location][populate][country][fields][0]", "name");
  params.append("populate[location][populate][city][fields][0]", "name");
  params.append("populate[location][populate][district][fields][0]", "governorate");

  // NOTE: the offerings content-type has NO `languages` relation — adding
  // populate[languages] makes Strapi reject the whole request with
  // 400 "Invalid key languages", which surfaced as "Something went wrong" on
  // the offerings list. (Removed; confirmed the query 200s without it.)

  return `/api/offerings?${params.toString()}`;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export interface OfferingsListParams {
  page: number;
  locale: "en" | "ar";
  categoryIds?: string[];
  offeringContentIds?: string[];
  priceRange?: string; // "min-max"
}

export const offeringsApi = {
  /**
   * Step 1: Fetch from Node.
   * Returns the paged Node result (totalPages, data).
   */
  async fetchFromNode(params: OfferingsListParams): Promise<NodeOfferingsResponse> {
    const qp = new URLSearchParams();
    qp.append("page", String(params.page));

    (params.categoryIds ?? []).forEach((id) => qp.append("categoryId", id));
    (params.offeringContentIds ?? []).forEach((id) => qp.append("offeringContentId", id));
    if (params.priceRange) qp.append("price", params.priceRange);

    const res = await nodeApi.get<NodeOfferingsResponse>(`/offering?${qp.toString()}`);
    return res.data;
  },

  /**
   * Step 2: Fetch from Strapi by ids.
   * Returns raw Strapi items.
   */
  async fetchFromStrapi(ids: number[], lang: "en" | "ar"): Promise<StrapiOffering[]> {
    if (ids.length === 0) return [];
    const query = buildStrapiQuery(ids, lang);
    const res = await http.get<{ data: StrapiOffering[] }>(query);
    return res.data?.data ?? [];
  },

  /**
   * Fetch the average rating for a single offering from Node.
   * Login-gated on Node side: if not logged in, 0 is returned by server.
   * One failure returns 0 (does NOT break the page).
   */
  async fetchOfferingRating(strapiId: number): Promise<number> {
    try {
      const res = await nodeApi.get<{
        averages?: { averageGeneralRating?: number };
        message?: string;
      }>(`/reviews/all-average-rating/Offering/${strapiId}`);
      if (res.data?.message?.toLowerCase().includes("no reviews")) return 0;
      return res.data?.averages?.averageGeneralRating ?? 0;
    } catch {
      return 0;
    }
  },

  /**
   * Full two-step fetch + merge → normalized Page<MergedOffering>.
   * Ratings are fetched in parallel (N+1 per web), only when isLoggedIn=true.
   */
  async listPage(
    params: OfferingsListParams,
    isLoggedIn: boolean,
    sort: string
  ): Promise<Page<MergedOffering>> {
    // Step 1 — Node
    const nodeRes = await offeringsApi.fetchFromNode(params);
    const nodeItems: NodeOffering[] = nodeRes.data ?? [];

    if (nodeItems.length === 0) {
      return { items: [], page: params.page, pageCount: nodeRes.totalPages ?? 0, total: nodeRes.totalCount ?? 0 };
    }

    // Step 2 — Strapi
    const strapiIds = nodeItems.map((n) => Number(n.offeringContentId)).filter((n) => !Number.isNaN(n));
    const strapiItems = await offeringsApi.fetchFromStrapi(strapiIds, params.locale);

    // Merge: strapiItem.id === nodeItem.offeringContentId
    const merged = mergeOfferingsByContentId(
      strapiItems,
      nodeItems,
      (_s, n) => ({ nodeData: n, ratingStars: 0 as number })
    );

    // Sort (client-side, exact web parity)
    if (sort === "price_asc") {
      merged.sort((a, b) => (a.nodeData.minPrice ?? 0) - (b.nodeData.minPrice ?? 0));
    } else if (sort === "price_desc") {
      merged.sort((a, b) => (b.nodeData.minPrice ?? 0) - (a.nodeData.minPrice ?? 0));
    } else {
      // Default: Strapi order asc
      merged.sort((a, b) => {
        if (a.order == null) return 1;
        if (b.order == null) return -1;
        return a.order - b.order;
      });
    }

    // Ratings (N+1 — parallel, login-gated)
    // Uses the shared injectAvgRatings helper (per-item failure → 0, missing id → 0).
    // fetchOfferingRating already catches internally; injectAvgRatings adds a second
    // try/catch wrapper at the batch level — both resolve 0, no behavior change.
    const items = isLoggedIn
      ? await injectAvgRatings(
          merged,
          (item) => String(item.id),
          (id) => offeringsApi.fetchOfferingRating(Number(id))
        )
      : merged;

    return {
      items,
      page: params.page,
      pageCount: nodeRes.totalPages ?? 1,
      total: nodeRes.totalCount ?? merged.length,
    };
  },
};
