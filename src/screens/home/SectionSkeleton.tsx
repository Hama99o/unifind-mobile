/**
 * SectionSkeleton — lightweight loading placeholder for home carousels.
 * Card proportions match the actual FeaturedCard (w-72, h-44 image + body).
 */

import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

interface SectionSkeletonProps {
  dark?: boolean;
}

function PulseBone({ className }: { className: string }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={style} className={className} />;
}

export function SectionSkeleton({ dark }: SectionSkeletonProps) {
  const boneBase = dark ? "bg-white/20" : "bg-muted";

  return (
    <View className={`py-6 px-4 ${dark ? "bg-prussian" : "bg-background"}`}>
      {/* Title row skeleton: accent bar + text */}
      <View className="flex-row items-center gap-2 mb-5">
        <PulseBone className={`w-1 h-6 rounded-full ${boneBase}`} />
        <PulseBone className={`h-5 w-44 rounded-lg ${boneBase}`} />
      </View>

      {/* Card skeletons — match FeaturedCard proportions (overflow-hidden clips to viewport) */}
      <View className="flex-row gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <View key={i} className={`w-72 rounded-2xl overflow-hidden flex-shrink-0 ${boneBase}`}>
            {/* Image area */}
            <PulseBone className={`w-full h-44 ${boneBase}`} />
            {/* Content body */}
            <View className="p-3 gap-2">
              <PulseBone className={`h-3 w-16 rounded ${boneBase}`} />
              <PulseBone className={`h-4 w-40 rounded ${boneBase}`} />
              <PulseBone className={`h-3 w-full rounded ${boneBase}`} />
              <PulseBone className={`h-3 w-2/3 rounded ${boneBase}`} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
