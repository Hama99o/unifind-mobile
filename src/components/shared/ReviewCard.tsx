/**
 * ReviewCard — single review card displayed in ReviewSection.
 *
 * Shows: star rating, date, experience text, per-category mini-ratings,
 * study period, and author avatar + name.
 *
 * Extracted from ReviewSection to keep that file under ~300 lines.
 * RTL-safe. Gluestack only.
 */

import { View, Image } from "react-native";
import { User } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { RatingStars } from "@/components/cards/RatingStars";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import { extractExperience, extractStudyPeriod } from "@/api/reviewsApi";
import type { ReviewItem } from "@/components/shared/ReviewSection";

interface ReviewCardProps {
  review: ReviewItem;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const colors = useColors();
  const { t, isRtl } = useCustomTranslation();
  const { formatDate } = useLocalization();

  const displayDate = (() => {
    try {
      return formatDate(review.date);
    } catch {
      return review.date;
    }
  })();

  const experience = review.experience || extractExperience(review.comment);
  const studyPeriod = review.studyPeriod || extractStudyPeriod(review.comment);

  return (
    <View className="bg-card rounded-2xl shadow-sm border border-border p-4 mb-3">
      {/* Stars + date */}
      <View className={`flex-row items-center justify-between mb-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        <RatingStars value={review.generalRating} size={16} />
        <Text className="text-xs text-muted-foreground">{displayDate}</Text>
      </View>

      {/* Experience text */}
      {experience ? (
        <Text
          className={`text-sm text-foreground mb-2 leading-relaxed ${isRtl ? "text-right" : ""}`}
        >
          "{experience}"
        </Text>
      ) : null}

      {/* Per-category mini-ratings */}
      {review.ratings.length > 0 && (
        <View className={`flex-row flex-wrap gap-3 mb-2 ${isRtl ? "flex-row-reverse" : ""}`}>
          {review.ratings.map((rat, i) => (
            <View key={i} className="items-center">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider">{rat.category}</Text>
              <Text className="text-sm font-semibold text-foreground">
                {rat.value}/5
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Study period */}
      {studyPeriod ? (
        <Text className="text-xs text-muted-foreground mb-2">
          {t("study_period")}: {studyPeriod}
        </Text>
      ) : null}

      <Divider className="mb-2" />

      {/* Author */}
      <View className={`flex-row items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        <View className="w-9 h-9 rounded-full bg-muted items-center justify-center overflow-hidden">
          {review.author.avatarUrl ? (
            <Image
              source={{ uri: review.author.avatarUrl }}
              style={{ width: 36, height: 36, borderRadius: 18 }}
              resizeMode="cover"
            />
          ) : (
            <User size={18} color={colors.mutedForeground} />
          )}
        </View>
        <Text className="text-sm font-semibold text-foreground">
          {review.author.name || t("anonymous")}
        </Text>
      </View>
    </View>
  );
}
