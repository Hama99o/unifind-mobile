/**
 * InstitutionReviewsSection — Section 5 of InstitutionDetailScreen.
 *
 * ReviewSection (averages / distribution / category cards / review list paginated)
 * + ReviewForm (id target for the Add-a-Review scroll).
 *
 * Uses useReviewList hook for paginated review fetching (targetType "Program",
 * studyPeriodStrategy "extract", refetch on submit).
 * RTL-safe.
 */

import { useCallback } from "react";
import { View } from "react-native";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { ReviewSection, ReviewSectionData } from "@/components/shared/ReviewSection";
import { ReviewForm } from "@/components/shared/ReviewForm";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useReviewList, type MapCategoriesFn } from "@/hooks/useReviewList";

interface InstitutionReviewsSectionProps {
  institutionDocumentId: string;
  institutionSlug: string;
  averages: {
    averageGeneralRating: number;
    averageQualityRating: number;
    averageFacilitiesRating: number;
    averageStudentLifeRating: number;
    totalReviews: number;
    star5: number;
    star4: number;
    star3: number;
    star2: number;
    star1: number;
  };
  locale: "en" | "ar";
  isLoggedIn: boolean;
  onReviewSubmitted?: () => void;
}

export function InstitutionReviewsSection({
  institutionDocumentId,
  institutionSlug,
  averages,
  locale,
  isLoggedIn,
  onReviewSubmitted,
}: InstitutionReviewsSectionProps) {
  const { t, isRtl } = useCustomTranslation();

  // mapCategories is stable (does not close over t directly — re-created per render but
  // useReviewList excludes it from the deps array, so it only re-fetches on parentId/page change).
  const mapCategories = useCallback<MapCategoriesFn>(
    (rev) => [
      { category: t("quality"), value: rev.ratings?.educationQuality ?? 0 },
      { category: t("campus_facilities"), value: rev.ratings?.campusFacilities ?? 0 },
      { category: t("student_life"), value: rev.ratings?.studentLife ?? 0 },
    ],
    [t]
  );

  const { reviews, currentPage, totalPages, setCurrentPage, refetch } = useReviewList(
    "Program",
    institutionDocumentId,
    mapCategories,
    { studyPeriodStrategy: "extract", anonymousFallback: t("anonymous") }
  );

  const handleReviewSubmitted = useCallback(() => {
    setCurrentPage(1);
    refetch();
    onReviewSubmitted?.();
  }, [refetch, setCurrentPage, onReviewSubmitted]);

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
        title: t("quality"),
        average: averages.averageQualityRating,
        totalReviews: averages.totalReviews,
      },
      {
        title: t("campus_facilities"),
        average: averages.averageFacilitiesRating,
        totalReviews: averages.totalReviews,
      },
      {
        title: t("student_life"),
        average: averages.averageStudentLifeRating,
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

      {/* Review form */}
      <ReviewForm
        institutionSlug={institutionSlug}
        institutionDocumentId={institutionDocumentId}
        locale={locale}
        isLoggedIn={isLoggedIn}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </View>
  );
}
