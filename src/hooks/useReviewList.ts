/**
 * useReviewList — encapsulates paginated review fetching + mapping.
 *
 * Owns page state, getSampleReviews call, map to ReviewItem[], and pagination.
 * Accepts a mapCategories callback so each caller supplies its own category labels.
 *
 * opts.studyPeriod:
 *   - Institution: pass extractStudyPeriod(rev.comment)
 *   - Offering: pass "" (no study period field)
 *
 * opts.onReviewSubmitted:
 *   - Institution: pass a callback to refetch on submit
 *   - Offering: omit (no review form)
 *
 * Returns { reviews, currentPage, totalPages, setCurrentPage, refetch }
 */

import { useState, useEffect, useCallback } from "react";
import {
  reviewsApi,
  extractExperience,
  extractStudyPeriod,
  formatReviewerName,
} from "@/api/reviewsApi";
import type { ReviewItem } from "@/components/shared/ReviewSection";

// ─── Types ────────────────────────────────────────────────────────────────────

type RawReview = {
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
};

export type MapCategoriesFn = (rev: RawReview) => Array<{ category: string; value: number }>;

export interface UseReviewListOpts {
  /** Static string for studyPeriod. Institution passes extractStudyPeriod; Offering passes "". */
  studyPeriodStrategy?: "extract" | "empty";
  /** Called when a review is submitted — triggers refetch. */
  onReviewSubmitted?: () => void;
  /** Fallback name when reviewer has no first/last name. */
  anonymousFallback?: string;
}

export interface UseReviewListReturn {
  reviews: ReviewItem[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  refetch: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReviewList(
  targetType: "Program" | "Offering",
  parentId: string,
  mapCategories: MapCategoriesFn,
  opts: UseReviewListOpts = {}
): UseReviewListReturn {
  const { studyPeriodStrategy = "extract", anonymousFallback = "" } = opts;

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  const fetchReviews = useCallback(
    async (page: number) => {
      if (!parentId) return;
      const res = await reviewsApi.getSampleReviews(targetType, parentId, page, 5);
      setTotalPages(res.totalPages || 1);

      const mapped: ReviewItem[] = (res.reviews ?? []).map((rev) => {
        const studyPeriod =
          studyPeriodStrategy === "extract"
            ? extractStudyPeriod(rev.comment)
            : "";

        return {
          generalRating: rev.generalRating ?? 0,
          date: rev.createdAt,
          comment: rev.comment,
          experience: extractExperience(rev.comment),
          studyPeriod,
          ratings: mapCategories(rev),
          author: {
            name: formatReviewerName(rev.firstName, rev.lastName, anonymousFallback),
            avatarUrl: rev.photo,
          },
        };
      });

      setReviews(mapped);
    },
    // mapCategories is expected to be stable (defined at module level by callers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parentId, targetType, studyPeriodStrategy, anonymousFallback]
  );

  useEffect(() => {
    fetchReviews(currentPage);
  }, [currentPage, fetchReviews]);

  const refetch = useCallback(() => {
    fetchReviews(currentPage);
  }, [currentPage, fetchReviews]);

  return { reviews, currentPage, totalPages, setCurrentPage, refetch };
}
