/**
 * reviewsApi — Node API transport for user reviews.
 * Backend: Node (nodeApi + Auth0 Bearer).
 * Transport only — no multi-step logic.
 *
 * Endpoints:
 *   GET  /reviews/user                        → paginated user reviews
 *   DELETE /reviews/:id                       → delete a review
 *   GET  /reviews/university/:id/average-rating → avg rating for institution
 *   GET  /reviews/user/offering/:offeringContentId → check if already reviewed
 *   POST /reviews                             → create a review
 */

import { nodeApi } from "@/api/nodeApi";
import { http } from "@/api/http";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewRating {
  category: string;
  value: number;
}

export interface UserReview {
  id: string;
  targetID: string;
  targetType: "Program" | "Offering";
  generalRating: number;
  ratings: {
    educationQuality?: number;
    campusFacilities?: number;
    studentLife?: number;
    contentHelpfulness?: number;
    specialistRating?: number;
    recommendOffering?: number;
  };
  comment: string;
  createdAt: string;
  firstName?: string;
  photo?: string;
}

export interface UserReviewsResponse {
  data: UserReview[];
  totalPages: number;
  currentPage: number;
}

export interface NormalizedReview {
  id: string;
  targetType: "Program" | "Offering";
  generalRating: number;
  comment: string;
  experience: string;
  studyPeriod: string;
  ratings: ReviewRating[];
  date: string;
  targetName: string;
}

export interface CreateReviewDto {
  targetID: string;
  targetType: "Program" | "Offering";
  generalRating: number;
  /** For institution reviews: the institution documentId */
  parentID?: string;
  ratings: {
    contentHelpfulness?: number;
    specialistRating?: number;
    recommendOffering?: number;
    educationQuality?: number;
    campusFacilities?: number;
    studentLife?: number;
  };
  comment: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a reviewer's display name. Falls back to `fallback` if both parts are empty. */
export function formatReviewerName(first?: string, last?: string, fallback = ""): string {
  return `${first ?? ""}${last ? " " + last : ""}`.trim() || fallback;
}

/** Extract the "Experience" portion from the structured comment. */
export function extractExperience(comment: string): string {
  if (!comment) return "";
  const match = comment.match(/Experience:\s*([\s\S]*?)(?:\n|$)/);
  return match ? match[1].trim() : comment;
}

/** Extract the "Study Period" portion from the structured comment. */
export function extractStudyPeriod(comment: string): string {
  if (!comment) return "";
  const match = comment.match(/Study Period:\s*([^\n]+)/);
  return match ? match[1].trim() : "";
}

/** Fetch program name from Strapi by id. */
async function fetchProgramName(programId: string): Promise<string> {
  try {
    const res = await http.get<{ data: Array<{ name?: string }> }>(
      `/api/programs?filters[id][$eq]=${programId}&fields[0]=name&status=draft`
    );
    return res.data?.data?.[0]?.name ?? "";
  } catch {
    return "";
  }
}

/** Fetch offering title from Strapi by id. */
async function fetchOfferingTitle(offeringId: string): Promise<string> {
  try {
    const res = await http.get<{ data: Array<{ title?: string }> }>(
      `/api/offerings?filters[id][$eq]=${offeringId}&fields[0]=title&status=draft`
    );
    return res.data?.data?.[0]?.title ?? "";
  } catch {
    return "";
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const reviewsApi = {
  /** GET /reviews/user — paginated user reviews */
  async getUserReviews(page: number, limit: number): Promise<UserReviewsResponse> {
    const res = await nodeApi.get<UserReviewsResponse>("/reviews/user", {
      params: { page, limit },
    });
    return res.data;
  },

  /** DELETE /reviews/:id */
  async deleteReview(id: string): Promise<void> {
    await nodeApi.delete(`/reviews/${id}`);
  },

  /** GET /reviews/university/:id/average-rating
   * Web response shape: { avgRating: number } OR { message: "No general ratings..." }
   * (not wrapped in { type, data } — direct object)
   */
  async getInstitutionAvgRating(institutionId: string): Promise<number> {
    try {
      const res = await nodeApi.get<{ avgRating?: number; message?: string }>(
        `/reviews/university/${institutionId}/average-rating`
      );
      const d = res.data;
      if (d?.message && d.message.toLowerCase().includes("no general ratings")) {
        return 0;
      }
      return d?.avgRating ?? 0;
    } catch {
      return 0;
    }
  },

  /** GET /reviews/user/offering/:offeringContentId — check if already reviewed.
   * The backend returns a string message if already reviewed and a data object/array otherwise.
   * Defensive: treat any non-array, non-object (i.e. string) response as "already reviewed". */
  async checkOfferingReviewed(offeringContentId: string): Promise<boolean> {
    try {
      const res = await nodeApi.get<string | object>(
        `/reviews/user/offering/${offeringContentId}`
      );
      const d = res.data;
      // If the response is a string, it means the backend returned an error/already-reviewed message.
      if (typeof d === "string") {
        return d.toLowerCase().replace(/\s+/g, "").includes("cantreview");
      }
      // Array response = list of reviews = not yet reviewed (or empty)
      if (Array.isArray(d)) return false;
      // Object with data property = review exists = already reviewed
      if (d && typeof d === "object" && "data" in d) return true;
      return false;
    } catch {
      return false;
    }
  },

  /** POST /reviews — create a review */
  async createReview(dto: CreateReviewDto): Promise<{ message: string }> {
    const res = await nodeApi.post<{ message: string }>("/reviews", dto);
    return res.data;
  },

  /**
   * GET /reviews/all-average-rating/Institution/:documentId
   * Returns averages + distribution for the institution detail hero.
   * If backend returns "No reviews" message → returns zeros.
   */
  async getAllAverageRating(
    targetType: "Institution" | "Program" | "Offering",
    documentId: string
  ): Promise<{
    averageGeneralRating: number;
    averageQualityRating: number;
    averageFacilitiesRating: number;
    averageStudentLifeRating: number;
    /** Offering-specific: contentHelpfulness avg */
    averageHelpfulnessRating: number;
    /** Offering-specific: specialistRating avg */
    averagespecialistRating: number;
    /** Offering-specific: recommendOffering avg */
    averagerecommendRating: number;
    totalReviews: number;
    star5: number;
    star4: number;
    star3: number;
    star2: number;
    star1: number;
  }> {
    const ZERO = {
      averageGeneralRating: 0,
      averageQualityRating: 0,
      averageFacilitiesRating: 0,
      averageStudentLifeRating: 0,
      averageHelpfulnessRating: 0,
      averagespecialistRating: 0,
      averagerecommendRating: 0,
      totalReviews: 0,
      star5: 0,
      star4: 0,
      star3: 0,
      star2: 0,
      star1: 0,
    };
    try {
      const res = await nodeApi.get<{
        message?: string;
        averages?: typeof ZERO;
      }>(`/reviews/all-average-rating/${targetType}/${documentId}`);
      const d = res.data;
      if (!d) return ZERO;
      if (typeof d.message === "string" && d.message.toLowerCase().includes("no reviews")) {
        return ZERO;
      }
      return { ...ZERO, ...(d.averages ?? d) };
    } catch {
      return ZERO;
    }
  },

  /**
   * GET /reviews/seven-reviews/Program/:parentId?page=&limit=5
   * Returns paginated review cards for the institution (target type = Program, parent = institution).
   */
  async getSampleReviews(
    targetType: "Program" | "Offering",
    parentId: string,
    page: number,
    limit = 5
  ): Promise<{
    reviews: Array<{
      generalRating: number;
      ratings: {
        educationQuality?: number;
        campusFacilities?: number;
        studentLife?: number;
        contentHelpfulness?: number;
        specialistRating?: number;
        recommendOffering?: number;
      };
      comment: string;
      createdAt: string;
      firstName?: string;
      lastName?: string;
      photo?: string;
    }>;
    totalReviews: number;
    totalPages: number;
  }> {
    const EMPTY = { reviews: [], totalReviews: 0, totalPages: 0 };
    try {
      const res = await nodeApi.get<typeof EMPTY>(
        `/reviews/seven-reviews/${targetType}/${parentId}?page=${page}&limit=${limit}`
      );
      return res.data ?? EMPTY;
    } catch {
      return EMPTY;
    }
  },

  /**
   * GET /reviews/user/university/:documentId
   * Legacy endpoint — check if user has already reviewed an institution.
   * Treat any non-error response as "can review" (legacy behaviour).
   */
  async checkReviewedInstitution(documentId: string): Promise<boolean> {
    try {
      const res = await nodeApi.get<string | object>(
        `/reviews/user/university/${documentId}`
      );
      const d = res.data;
      if (typeof d === "string") {
        return d.toLowerCase().replace(/\s+/g, "").includes("cantreview");
      }
      return false;
    } catch {
      return false;
    }
  },

  /** Normalize raw review adding target name from Strapi. */
  async normalizeReview(
    raw: UserReview,
    categoryLabels: { quality: string; campusFacilities: string; studentLife: string; helpfulness: string; specialist: string; recommendOffering: string }
  ): Promise<NormalizedReview> {
    const targetName =
      raw.targetType === "Program"
        ? await fetchProgramName(raw.targetID)
        : await fetchOfferingTitle(raw.targetID);

    let ratings: ReviewRating[];
    if (raw.targetType === "Program") {
      ratings = [
        { category: categoryLabels.quality, value: raw.ratings.educationQuality ?? 0 },
        { category: categoryLabels.campusFacilities, value: raw.ratings.campusFacilities ?? 0 },
        { category: categoryLabels.studentLife, value: raw.ratings.studentLife ?? 0 },
      ];
    } else {
      ratings = [
        { category: categoryLabels.helpfulness, value: raw.ratings.contentHelpfulness ?? 0 },
        { category: categoryLabels.specialist, value: raw.ratings.specialistRating ?? 0 },
        { category: categoryLabels.recommendOffering, value: raw.ratings.recommendOffering ?? 0 },
      ];
    }

    return {
      id: raw.id,
      targetType: raw.targetType,
      generalRating: raw.generalRating ?? 0,
      comment: raw.comment,
      experience: extractExperience(raw.comment),
      studyPeriod: extractStudyPeriod(raw.comment),
      ratings,
      date: raw.createdAt,
      targetName,
    };
  },
};
