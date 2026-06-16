/**
 * RatingStars — shared star-rating display component.
 * Read-only; interactive version can be added via onChange.
 */

import { View } from "react-native";
import { Star } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";

interface RatingStarsProps {
  /** Value from 0 to 5, decimals allowed */
  value: number;
  /** Number of stars (default 5) */
  max?: number;
  /** Star size in pixels (default 14) */
  size?: number;
  /** Extra className for the container */
  className?: string;
}

export function RatingStars({ value, max = 5, size = 14, className }: RatingStarsProps) {
  const colors = useColors();
  const filled = Math.round(value);

  return (
    <View className={`flex-row gap-0.5 ${className ?? ""}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          color={i < filled ? colors.accent : colors.border}
          fill={i < filled ? colors.accent : "transparent"}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}
