/**
 * OfferingReviewsSection — Read-only reviews for an offering.
 *
 * Displays: ReviewSection with 3 offering categories
 *   (helpfulness / specialist / recommendOffering).
 * NO add-review form (web page doesn't have it either).
 *
 * Uses useReviewList hook (targetType "Offering", studyPeriodStrategy "empty").
 * RTL-safe. No hardcoded hex. Gluestack only.
 */

import { useCallback } from "react";
import { View } from "react-native";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { ReviewSection } from "@/components/shared/ReviewSection";
import type { ReviewSectionData } from "@/components/shared/ReviewSection";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useReviewList, type MapCategoriesFn } from "@/hooks/useReviewList";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfferingReviewsSectionProps {
  strapiId: string;
  averages: {
    averageGeneralRating: number;
    averageHelpfulnessRating: number;
    averagespecialistRating: number;
    averagerecommendRating: number;
    totalReviews: number;
    star5: number;
    star4: number;
    star3: number;
    star2: number;
    star1: number;
  };
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function OfferingReviewsSection({ strapiId, averages }: OfferingReviewsSectionProps) {
  const { t, isRtl } = useCustomTranslation();

  const mapCategories = useCallback<MapCategoriesFn>(
    (rev) => [
      { category: t("helpfulness"), value: rev.ratings?.contentHelpfulness ?? 0 },
      { category: t("specialist"), value: rev.ratings?.specialistRating ?? 0 },
      { category: t("recommendOffering"), value: rev.ratings?.recommendOffering ?? 0 },
    ],
    [t]
  );

  const { reviews, currentPage, totalPages, setCurrentPage } = useReviewList(
    "Offering",
    strapiId,
    mapCategories,
    { studyPeriodStrategy: "empty", anonymousFallback: t("anonymous") }
  );

  const data: ReviewSectionData = {
    average: averages.averageGeneralRating,
    totalReviews: averages.totalReviews,
    distribution: [
      { star: 5, count: averages.star5 },
      { star: 4, count: averages.star4 },
      { star: 3, count: averages.star3 },
      { star: 2, count: averages.star2 },
      { star: 1, count: averages.star1 },
    ],
    categories: [
      {
        title: t("helpfulness"),
        average: averages.averageHelpfulnessRating,
        totalReviews: averages.totalReviews,
      },
      {
        title: t("specialist"),
        average: averages.averagespecialistRating,
        totalReviews: averages.totalReviews,
      },
      {
        title: t("recommendOffering"),
        average: averages.averagerecommendRating,
        totalReviews: averages.totalReviews,
      },
    ],
    reviews,
  };

  return (
    <View className="px-4 gap-4">
      <Heading size="md" className={`text-foreground mb-1 ${isRtl ? "text-right" : ""}`}>
        {t("reviews")}
      </Heading>
      <Divider className="mb-3" />

      <ReviewSection
        data={data}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </View>
  );
}
