/**
 * BookingReviewSection — leave-a-review form for completed bookings.
 *
 * Checks GET {Node}/reviews/user/offering/:offeringContentId first.
 * If already reviewed: show "can't review twice" message.
 * Otherwise: form with:
 *   - General Rating 1–5 (required)
 *   - Content Helpfulness 1–5 (required)
 *   - Specialist Rating 1–5 (required)
 *   - Recommend Offering 1–5 (optional)
 *   - Experience textarea (optional)
 * Submit POST {Node}/reviews. Success resets form + toast.
 */

import { useState, useEffect } from "react";
import { View, Pressable } from "react-native";
import { Star } from "lucide-react-native";
import { Skeleton } from "@/components/ui/skeleton";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/box";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { showToast } from "@/stores/toastStore";
import { reviewsApi } from "@/api/reviewsApi";
import { useColors } from "@/hooks/useColors";

// ─── Interactive star rating ──────────────────────────────────────────────────

/**
 * AnimatedStar — single star with §S7 pop animation on press.
 * Scale: withSequence(withSpring(1.3, {damping:6}), withSpring(1))
 */
function AnimatedStar({
  star,
  value,
  onChange,
  invalid,
}: {
  star: number;
  value: number;
  onChange: (v: number) => void;
  invalid?: boolean;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.3, { damping: 6 }),
      withSpring(1)
    );
    onChange(star);
  };

  return (
    <Pressable onPress={handlePress} hitSlop={4}>
      <Animated.View style={animStyle}>
        <Star
          size={28}
          color={invalid && value === 0 ? colors.destructive : colors.accent}
          fill={star <= value ? colors.accent : "transparent"}
          strokeWidth={1.5}
        />
      </Animated.View>
    </Pressable>
  );
}

function StarRating({
  value,
  onChange,
  invalid,
}: {
  value: number;
  onChange: (v: number) => void;
  invalid?: boolean;
}) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <AnimatedStar
          key={star}
          star={star}
          value={value}
          onChange={onChange}
          invalid={invalid}
        />
      ))}
    </View>
  );
}

// ─── Rating row ───────────────────────────────────────────────────────────────

function RatingRow({
  label,
  required,
  value,
  onChange,
  invalid,
}: {
  label: string;
  required?: boolean;
  value: number;
  onChange: (v: number) => void;
  invalid?: boolean;
}) {
  return (
    <View className="gap-1">
      <View className="flex-row items-center gap-1">
        <Text className="text-sm font-medium text-foreground">{label}</Text>
        {required && <Text className="text-sm text-destructive">*</Text>}
      </View>
      <StarRating value={value} onChange={onChange} invalid={invalid} />
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface BookingReviewSectionProps {
  offeringContentId: string;
  specialistName: string;
  eventTypeMode: string;
}

export function BookingReviewSection({
  offeringContentId,
  specialistName,
  eventTypeMode,
}: BookingReviewSectionProps) {
  const { t } = useCustomTranslation();
  const colors = useColors();

  const [isReviewed, setIsReviewed] = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const [generalRating, setGeneralRating] = useState(0);
  const [contentHelpfulness, setContentHelpfulness] = useState(0);
  const [specialistRating, setSpecialistRating] = useState(0);
  const [recommendOffering, setRecommendOffering] = useState(0);
  const [experience, setExperience] = useState("");

  useEffect(() => {
    reviewsApi
      .checkOfferingReviewed(offeringContentId)
      .then((reviewed) => setIsReviewed(reviewed))
      .finally(() => setCheckLoading(false));
  }, [offeringContentId]);

  const handleSubmit = async () => {
    if (!generalRating || !contentHelpfulness || !specialistRating) {
      setShowValidation(true);
      showToast(t("review.validationError"));
      return;
    }

    setSubmitting(true);
    try {
      const comment = `Specialist: ${specialistName}\nType: ${eventTypeMode}\nExperience: ${experience}`;
      const res = await reviewsApi.createReview({
        targetID: offeringContentId,
        targetType: "Offering",
        generalRating,
        ratings: {
          contentHelpfulness,
          specialistRating,
          recommendOffering: recommendOffering || 0,
        },
        comment,
      });

      if (res.message === "Review created successfully") {
        setGeneralRating(0);
        setContentHelpfulness(0);
        setSpecialistRating(0);
        setRecommendOffering(0);
        setExperience("");
        setIsReviewed(true);
        setShowValidation(false);
        showToast(t("review.submitSuccess"));
      } else {
        showToast(t("review.submitError"));
      }
    } catch {
      showToast(t("review.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (checkLoading) {
    return (
      <Skeleton className="h-16 rounded-xl bg-muted" />
    );
  }

  if (isReviewed) {
    return (
      <View className="bg-card rounded-2xl border border-border p-6 items-center justify-center" style={{ minHeight: 100 }}>
        <Text className="text-base text-center text-foreground font-semibold">
          {t("review.alreadyReviewed")}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-card rounded-2xl border border-border p-4 gap-4">
      <Heading size="sm" className="text-foreground">{t("review.leaveReview")}</Heading>

      {/* General Rating */}
      <RatingRow
        label={t("review.generalRating")}
        required
        value={generalRating}
        onChange={setGeneralRating}
        invalid={showValidation}
      />

      {/* Sub-ratings grid */}
      <View className="gap-3">
        <RatingRow
          label={t("review.contentHelpfulness")}
          required
          value={contentHelpfulness}
          onChange={setContentHelpfulness}
          invalid={showValidation}
        />
        <RatingRow
          label={t("review.specialistRating")}
          required
          value={specialistRating}
          onChange={setSpecialistRating}
          invalid={showValidation}
        />
        <RatingRow
          label={t("review.recommendOffering")}
          value={recommendOffering}
          onChange={setRecommendOffering}
        />
      </View>

      {/* Experience textarea — Gluestack Textarea */}
      <VStack className="gap-1">
        <Text className="text-sm font-medium text-foreground">{t("review.shareExperience")}</Text>
        <Textarea>
          <TextareaInput
            value={experience}
            onChangeText={setExperience}
            placeholder={t("review.experiencePlaceholder")}
          />
        </Textarea>
      </VStack>

      <Button
        label={submitting ? t("common.loading") : t("review.submit")}
        action="primary"
        onPress={handleSubmit}
        disabled={submitting}
      />
    </View>
  );
}
