/**
 * ReviewSection — generic review display component.
 *
 * Shows:
 *   - Overview: big average + stars + distribution bars (5→1)
 *   - Horizontal category cards (Quality / Campus Facilities / Student Life)
 *   - Paginated per-review cards (delegated to ReviewCard)
 *
 * Reusable for institution + offering reviews.
 * ReviewCard extracted to ReviewCard.tsx to keep this file under ~300 lines.
 * RTL-safe. Gluestack only. No hardcoded hex.
 */

import { View, Pressable, ScrollView } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { RatingStars } from "@/components/cards/RatingStars";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { ReviewCard } from "@/components/shared/ReviewCard";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewCategoryData {
  title: string;
  average: number;
  totalReviews: number;
}

export interface ReviewItem {
  generalRating: number;
  date: string;
  comment: string;
  experience?: string;
  studyPeriod?: string;
  ratings: Array<{ category: string; value: number }>;
  author: {
    name: string;
    avatarUrl?: string;
  };
}

export interface ReviewDistribution {
  star: number;
  count: number;
}

export interface ReviewSectionData {
  average: number;
  totalReviews: number;
  distribution: ReviewDistribution[];
  categories: ReviewCategoryData[];
  reviews: ReviewItem[];
}

interface ReviewSectionProps {
  data: ReviewSectionData;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// ─── Distribution bar ─────────────────────────────────────────────────────────

function DistributionBar({
  star,
  count,
  total,
}: {
  star: number;
  count: number;
  total: number;
}) {
  const { t, isRtl } = useCustomTranslation();
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <View className="flex-row items-center gap-2 py-1">
      <Text className="text-xs text-muted-foreground w-14">
        {star} {t("stars")}
      </Text>
      <View className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <View
          className="h-2 bg-accent rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
      <Text className={`text-xs text-muted-foreground w-5 ${isRtl ? "text-left" : "text-right"}`}>{count}</Text>
    </View>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({ category }: { category: ReviewCategoryData }) {
  const { isRtl } = useCustomTranslation();
  return (
    <View className="bg-card rounded-xl shadow-sm border border-border p-4 mr-3 w-40">
      <Text
        className={`text-xs text-muted-foreground mb-2 ${isRtl ? "text-right" : ""}`}
        numberOfLines={2}
      >
        {category.title}
      </Text>
      <Heading size="lg" className="text-foreground">
        {Number(category.average).toFixed(1)}
      </Heading>
      <RatingStars value={category.average} size={12} className="mt-1" />
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReviewSection({
  data,
  currentPage,
  totalPages,
  onPageChange,
}: ReviewSectionProps) {
  const { t, isRtl } = useCustomTranslation();
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const colors = useColors();

  return (
    <View>
      {/* Overview card */}
      <View className="bg-card rounded-xl shadow-sm border border-border p-4 mb-4">
        <Heading size="md" className="text-foreground mb-3">
          {t("reviews_ratings")}
        </Heading>

        <View className={`flex-row gap-6 ${isRtl ? "flex-row-reverse" : ""}`}>
          {/* Left: big average */}
          <View className="items-center gap-1">
            <Text className="text-xs text-muted-foreground">{t("overal_reviews_ratings")}</Text>
            <Text className="text-5xl font-bold text-foreground">
              {Number(data.average).toFixed(1)}
            </Text>
            <RatingStars value={data.average} size={16} />
            <Text className="text-xs text-muted-foreground text-center">
              {t("based_on")} {data.totalReviews} {t("reviews")}
            </Text>
          </View>

          {/* Right: distribution bars */}
          <View className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const found = data.distribution.find((d) => d.star === star);
              return (
                <DistributionBar
                  key={star}
                  star={star}
                  count={found?.count ?? 0}
                  total={data.totalReviews}
                />
              );
            })}
          </View>
        </View>
      </View>

      {/* Category cards horizontal scroll */}
      {data.categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ paddingHorizontal: 0, paddingRight: 16 }}
        >
          {data.categories.map((cat, i) => (
            <CategoryCard key={i} category={cat} />
          ))}
        </ScrollView>
      )}

      {/* Reviews list — each card in its own file */}
      {data.reviews.map((review, i) => (
        <ReviewCard key={i} review={review} />
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <View className={`flex-row items-center justify-center gap-4 mt-2 ${isRtl ? "flex-row-reverse" : ""}`}>
          <Pressable
            onPress={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            hitSlop={10}
            className={currentPage <= 1 ? "opacity-30" : ""}
          >
            <BackIcon size={22} color={colors.foreground} />
          </Pressable>
          <Text className="text-sm text-foreground">
            {currentPage} / {totalPages}
          </Text>
          <Pressable
            onPress={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            hitSlop={10}
            className={currentPage >= totalPages ? "opacity-30" : ""}
          >
            <NextIcon size={22} color={colors.foreground} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
