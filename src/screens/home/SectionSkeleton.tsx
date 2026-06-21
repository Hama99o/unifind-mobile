/**
 * SectionSkeleton — lightweight loading placeholder for home carousels.
 * Card proportions match the actual FeaturedCard (w-72, h-44 image + body).
 */

import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

interface SectionSkeletonProps {
  dark?: boolean;
}

export function SectionSkeleton({ dark }: SectionSkeletonProps) {
  const boneBase = dark ? "bg-white/20" : "bg-muted";

  return (
    <View className={`py-6 px-4 ${dark ? "bg-prussian" : "bg-background"}`}>
      {/* Title row skeleton: accent bar + text */}
      <View className="flex-row items-center gap-2 mb-5">
        <Skeleton className={`w-1 h-6 rounded-full ${boneBase}`} />
        <Skeleton className={`h-5 w-44 rounded-lg ${boneBase}`} />
      </View>

      {/* Card skeletons — match FeaturedCard proportions (overflow-hidden clips to viewport) */}
      <View className="flex-row gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <View key={i} className={`w-72 rounded-2xl overflow-hidden flex-shrink-0 ${boneBase}`}>
            {/* Image area */}
            <Skeleton className={`w-full h-44 ${boneBase}`} />
            {/* Content body */}
            <View className="p-3 gap-2">
              <Skeleton className={`h-3 w-16 rounded ${boneBase}`} />
              <Skeleton className={`h-4 w-40 rounded ${boneBase}`} />
              <Skeleton className={`h-3 w-full rounded ${boneBase}`} />
              <Skeleton className={`h-3 w-2/3 rounded ${boneBase}`} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
