/**
 * usePressScale — shared press-scale animation hook.
 *
 * Returns an animated style and two handlers for a 0.97 scale-down / 1 scale-up
 * press feedback, using react-native-reanimated.
 *
 * Timings (match original inline copies in FeaturedCard + TestimonialCard):
 *   PressIn:  scale → 0.97 over 100ms
 *   PressOut: scale → 1.00 over 150ms
 */

import { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

export function usePressScale() {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  return { animStyle, handlePressIn, handlePressOut };
}
