/**
 * Skeleton — shared Reanimated opacity-pulse placeholder.
 *
 * Single component for all loading skeleton bones in the app.
 * Pass className for tone (bg-muted on light surfaces, bg-white/15 on dark
 * bands) and optional style for fixed dimensions.
 *
 * Animation: opacity 0.4 → 1 → 0.4 repeat, 800ms, Easing.inOut(Easing.ease).
 *
 * Usage:
 *   <Skeleton className="h-4 w-32 rounded bg-muted" />
 *   <Skeleton className="h-36 bg-white/15" style={{ width: 256 }} />
 */

import { useEffect } from "react";
import { type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface SkeletonProps {
  className?: string;
  style?: ViewStyle;
}

export function Skeleton({ className, style }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[animStyle, style]}
      className={className}
    />
  );
}
