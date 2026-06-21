/**
 * InteractiveRatingStars — tappable star rating input.
 *
 * Tap a star to set the rating. Shows a red outline when invalid.
 * Used by ReviewForm for general/category ratings.
 */

import { View, Pressable } from "react-native";
import { Star } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";

interface InteractiveRatingStarsProps {
  value: number;
  onChange: (rating: number) => void;
  max?: number;
  size?: number;
  isInvalid?: boolean;
}

export function InteractiveRatingStars({
  value,
  onChange,
  max = 5,
  size = 28,
  isInvalid = false,
}: InteractiveRatingStarsProps) {
  const colors = useColors();

  return (
    <View className={`flex-row gap-1 p-1 rounded-lg ${isInvalid ? "border border-destructive" : ""}`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value;
        return (
          <Pressable
            key={i}
            onPress={() => onChange(i + 1)}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Star
              size={size}
              color={filled ? colors.accent : colors.border}
              fill={filled ? colors.accent : "transparent"}
              strokeWidth={1.5}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
