/**
 * testimonialsService — multi-step testimonial join (Node + Strapi).
 *
 * Steps:
 *  1. GET /reviews/latest-reviews-offering-program (Node, no auth)
 *  2. Fetch institutions + programs (Strapi) for Program-type reviews
 *  3. Fetch offerings (Strapi) for Offering-type reviews
 *  4. Join client-side; drop any item whose Strapi entity is missing
 */

import { nodeApi } from "@/api/nodeApi";
import {
  fetchInstitutionsByDocumentIds,
  fetchProgramsByDocumentIds,
  fetchOfferingsByIds,
} from "@/api/catalog.say";
import {
  extractExperience as _extractExperience,
} from "@/api/reviewsApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TestimonialItem {
  /** Banner image URL (institution photoCover or offering image) */
  imageUrl: string;
  /** Logo URL — only for institution-backed reviews */
  logoUrl: string;
  /** Title shown on card: institution name or offering title */
  title: string;
  /** General star rating 0–5 */
  rating: number;
  /** Extracted experience quote */
  testimonial: string;
  /** Reviewer first name */
  userName: string;
  /** Reviewer avatar URL or null */
  userAvatar: string | null;
  /** Program name (only for Program reviews) */
  userProgram: string;
  /** Deep-link target (TODO: replace with actual route when built) */
  linkHref: string;
}

// ─── Raw Node review shape ────────────────────────────────────────────────────

interface RawReview {
  reviewer?: string;
  targetID?: string;
  parentID?: string;
  generalRating?: number;
  comment?: string;
  firstName?: string;
  lastName?: string;
  photo?: { url?: string } | string | null;
  targetType?: "Program" | "Offering" | string;
}

interface RawReviewsResponse {
  reviews?: RawReview[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * extractExperience — canonical version from reviewsApi (multi-line aware).
 * M3 fix: removed the local copy; importing from reviewsApi.
 * Re-export so any legacy import of extractExperience from this file still resolves.
 */
export { extractExperience } from "@/api/reviewsApi";

/**
 * Local alias so the helper usage below works without changing call sites.
 * The canonical regex lives in reviewsApi.ts.
 */
const extractExperienceLocal = _extractExperience;

/** Extract the text after "Program Studied:" in the comment field. */
export function extractProgramStudied(comment: string | null | undefined): string {
  if (!comment) return "";
  const match = comment.match(/Program Studied:\s*(.+)/);
  return match ? match[1].trim() : "";
}

function resolvePhotoUrl(photo: { url?: string } | string | null | undefined): string | null {
  if (!photo) return null;
  if (typeof photo === "string") return photo;
  return photo.url ?? null;
}

// ─── Main service ─────────────────────────────────────────────────────────────

/**
 * Fetch and join the latest testimonials.
 * Returns up to ~6 joined cards; silently drops reviews whose Strapi entity
 * cannot be found (filter Boolean pattern from web).
 */
export async function fetchTestimonials(locale: "en" | "ar"): Promise<TestimonialItem[]> {
  // Step 1: fetch raw reviews from Node (no auth required)
  const response = await nodeApi.get<RawReviewsResponse>(
    "/reviews/latest-reviews-offering-program"
  );
  const rawReviews: RawReview[] = response.data?.reviews ?? [];

  if (!rawReviews.length) return [];

  // Partition by type
  const programReviews = rawReviews.filter((r) => r.targetType === "Program");
  const offeringReviews = rawReviews.filter((r) => r.targetType === "Offering");

  // Step 2a: collect Strapi IDs needed
  // For Program reviews: parentID = institution documentId, targetID = program documentId
  // (mirrors web fetchReviews which remaps: targetID=review.parentID, programStudied=review.targetID)
  const institutionDocIds = [...new Set(programReviews.map((r) => r.parentID).filter(Boolean) as string[])];
  const programDocIds = [...new Set(programReviews.map((r) => r.targetID ?? "").filter(Boolean))];
  const offeringIds = [...new Set(offeringReviews.map((r) => r.targetID).filter(Boolean) as string[])];

  // Step 2b: fetch Strapi data in parallel
  const [institutions, programs, offerings] = await Promise.all([
    fetchInstitutionsByDocumentIds(locale, institutionDocIds),
    fetchProgramsByDocumentIds(locale, programDocIds),
    fetchOfferingsByIds(locale, offeringIds),
  ]);

  // Step 3: join
  const testimonials: TestimonialItem[] = [];

  for (const review of rawReviews) {
    if (review.targetType === "Program") {
      // parentID = institution documentId; targetID = program documentId
      const institution = institutions.find(
        (i) => String(i.documentId) === String(review.parentID)
      );
      if (!institution) continue; // drop — Strapi entity missing

      const program = programs.find(
        (p) => String(p.documentId) === String(review.targetID)
      );

      testimonials.push({
        imageUrl: institution.photoCoverUrl,
        logoUrl: institution.logoUrl,
        title: institution.name,
        rating: review.generalRating ?? 0,
        testimonial: extractExperienceLocal(review.comment ?? ""),
        userName: review.firstName ?? "",
        userAvatar: resolvePhotoUrl(review.photo),
        userProgram: program?.name ?? "",
        // TODO: replace with actual route when institution-detail screen is built
        linkHref: `institution-detail/${institution.slug}`,
      });
    } else if (review.targetType === "Offering") {
      const offering = offerings.find(
        (o) => String(o.id) === String(review.targetID)
      );
      if (!offering) continue; // drop — Strapi entity missing

      testimonials.push({
        imageUrl: offering.imageUrl,
        logoUrl: "",
        title: offering.title,
        rating: review.generalRating ?? 0,
        testimonial: extractExperienceLocal(review.comment ?? ""),
        userName: review.firstName ?? "",
        userAvatar: resolvePhotoUrl(review.photo),
        userProgram: "",
        // TODO: replace with actual route when offering-detail screen is built
        linkHref: `offering-detail/${offering.slug}`,
      });
    }
  }

  return testimonials;
}
