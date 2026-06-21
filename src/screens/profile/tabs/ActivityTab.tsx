/**
 * ActivityTab — Profile > Activity tab.
 *
 * Sub-tabs: Reviews (the only visible one).
 *
 * Reviews: GET {Node}/reviews/user?page=<n>&limit=4
 * Infinite scroll — load next page near bottom.
 * Delete: confirmAlert → DELETE /reviews/:id → refetch from page 1.
 *
 * ReviewCard layout (§2):
 *   (1) target name — text-xs font-semibold text-muted-foreground uppercase tracking-wide
 *   (2) stars + date — flex-row justify-between
 *   (3) experience quote — border-l-2 border-lightgreen pl-3 italic text-sm text-foreground
 *   (4) per-category Badge chips — bg-muted text-foreground flex-row flex-wrap gap-2
 *
 * §S7 — cards entering={FadeInDown.duration(200).delay(index*50)}
 * §S6 — spinner uses colors.secondary (turquoise, not brand hex)
 * §S2 — trash hitSlop 8→16
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, View, ActivityIndicator, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Trash2, Star } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { confirmAlert } from "@/components/ui/alert-dialog";
import { RatingStars } from "@/components/cards/RatingStars";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import { useColors } from "@/hooks/useColors";
import { brand } from "@/config/theme";
import { reviewsApi, type NormalizedReview } from "@/api/reviewsApi";
import { showToast } from "@/stores/toastStore";

const LIMIT = 4;

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  onDelete,
  index,
}: {
  review: NormalizedReview;
  onDelete: () => void;
  index: number;
}) {
  const { t } = useCustomTranslation();
  const { formatDate } = useLocalization();
  const colors = useColors();

  const handleDelete = () => {
    confirmAlert(t("activityDeleteReviewTitle"), t("activityDeleteReviewMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <Animated.View entering={FadeInDown.duration(200).delay(index * 50)}>
      <View className="bg-card rounded-2xl border border-border p-4 mb-3 gap-3">

        {/* (1) Target name — eyebrow label */}
        {review.targetName ? (
          <Text
            className="text-xs font-semibold text-muted-foreground"
            style={{ textTransform: "uppercase", letterSpacing: 0.8 }}
            numberOfLines={1}
          >
            {review.targetName}
          </Text>
        ) : null}

        {/* (2) Stars + date — justified row with trash on the right */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <RatingStars value={review.generalRating} size={16} />
            <Text className="text-xs text-muted-foreground">
              {review.generalRating}/5
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Text className="text-xs text-muted-foreground">
              {formatDate(review.date)}
            </Text>
            {/* hitSlop 16 for ≥44px touch target */}
            <Pressable onPress={handleDelete} hitSlop={16} accessibilityLabel={t("delete")}>
              <Trash2 size={18} color={colors.destructive} />
            </Pressable>
          </View>
        </View>

        {/* (3) Experience quote — border-l-2 border-lightgreen accent */}
        {review.experience ? (
          <View
            style={{
              borderLeftWidth: 2,
              borderLeftColor: brand.lightGreen,
              paddingLeft: 12,
            }}
          >
            <Text className="text-sm text-foreground italic">
              "{review.experience}"
            </Text>
          </View>
        ) : null}

        {/* (4) Per-category Badge chips */}
        {review.ratings.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {review.ratings.map((r, i) => (
              <Badge key={i} className="bg-muted flex-row items-center gap-1">
                <Star size={11} color={colors.foreground} fill={colors.foreground} />
                <BadgeText className="text-foreground">{r.category} {r.value}/5</BadgeText>
              </Badge>
            ))}
          </View>
        ) : null}

        {/* Study period */}
        {review.studyPeriod ? (
          <Text className="text-xs text-muted-foreground">{review.studyPeriod}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ─── Review card skeleton ─────────────────────────────────────────────────────

function ReviewCardSkeleton() {
  return (
    <View className="bg-card rounded-2xl border border-border p-4 mb-3 gap-3">
      <Skeleton className="h-3 w-28 rounded bg-muted" />
      <Skeleton className="h-4 w-32 rounded bg-muted" />
      <Skeleton className="h-3 w-full rounded bg-muted" />
      <Skeleton className="h-3 w-3/4 rounded bg-muted" />
      <View className="flex-row gap-2">
        <Skeleton className="h-6 w-20 rounded-full bg-muted" />
        <Skeleton className="h-6 w-20 rounded-full bg-muted" />
        <Skeleton className="h-6 w-20 rounded-full bg-muted" />
      </View>
    </View>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function ActivityTab() {
  const { t } = useCustomTranslation();
  const colors = useColors();

  const [reviews, setReviews] = useState<NormalizedReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const categoryLabels = {
    quality: t("activityQuality"),
    campusFacilities: t("activityCampusFacilities"),
    studentLife: t("activityStudentLife"),
    helpfulness: t("activityHelpfulness"),
    specialist: t("activitySpecialist"),
    recommendOffering: t("activityRecommendOffering"),
  };

  const fetchReviews = useCallback(
    async (pageNum: number, reset = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (reset) setInitialLoading(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await reviewsApi.getUserReviews(pageNum, LIMIT);
        const rawList = Array.isArray(res.data) ? res.data : [];
        setTotalPages(res.totalPages || 1);

        const normalized = await Promise.all(
          rawList.map((r) => reviewsApi.normalizeReview(r, categoryLabels))
        );

        setReviews((prev) => {
          if (reset || pageNum === 1) return normalized;
          const existingIds = new Set(prev.map((r) => r.id));
          return [...prev, ...normalized.filter((r) => !existingIds.has(r.id))];
        });
      } catch {
        setError(t("common.retry"));
      } finally {
        setInitialLoading(false);
        setLoading(false);
        loadingRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    fetchReviews(1, true);
  }, []);

  const handleDelete = async (reviewId: string) => {
    try {
      await reviewsApi.deleteReview(reviewId);
      showToast(t("activityReviewDeleted"));
      setReviews([]);
      setPage(1);
      fetchReviews(1, true);
    } catch {
      showToast(t("profileDeleteError"));
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingRef.current) {
      loadingRef.current = true;
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReviews(nextPage);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isNearBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
        if (isNearBottom) handleLoadMore();
      }}
      scrollEventThrottle={200}
    >
      {/* Tab label */}
      <View className="flex-row items-center gap-2 mb-4">
        <View className="bg-lightgreen px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
          <Star size={14} color={brand.prussian} fill={brand.prussian} />
          <Text className="text-sm font-bold text-foreground">{t("reviews")}</Text>
        </View>
      </View>

      {/* Initial loading skeleton */}
      {initialLoading ? (
        <>
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
        </>
      ) : error ? (
        <View className="items-center gap-3 py-8">
          <Text className="text-destructive text-center">{error}</Text>
          <Button label={t("common.retry")} onPress={() => fetchReviews(1, true)} action="primary" />
        </View>
      ) : reviews.length === 0 ? (
        <EmptyState
          title={t("activityNoReviews")}
          description={t("activityNoReviewsDesc")}
        />
      ) : (
        <>
          {reviews.map((review, index) => (
            <ReviewCard
              key={review.id}
              review={review}
              onDelete={() => handleDelete(review.id)}
              index={index}
            />
          ))}
          {loading && (
            <View className="items-center py-4">
              {/* §S6: use colors.secondary token, not brand hex */}
              <ActivityIndicator color={colors.secondary} />
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
