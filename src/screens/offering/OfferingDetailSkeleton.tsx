/**
 * OfferingDetailSkeleton — content-shaped shimmer placeholder while offering data loads.
 *
 * Shape matches: cover band → breadcrumb → specialist avatars → hero card →
 * details strip → overview section → specialist section.
 *
 * S3: Uses shared Skeleton component (Reanimated opacity-pulse). No bare spinner.
 */

import { View, ScrollView } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

function SkelCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-card rounded-2xl border border-border p-4 gap-3">
      {children}
    </View>
  );
}

export function OfferingDetailSkeleton() {
  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Cover image band */}
      <Skeleton className="h-44 w-full rounded-none bg-muted" />

      {/* Breadcrumb row */}
      <View className="flex-row items-center gap-2 px-4 py-2">
        <Skeleton className="h-3 w-4 rounded bg-muted" />
        <Skeleton className="h-3 w-3 rounded bg-muted" />
        <Skeleton className="h-3 w-20 rounded bg-muted" />
        <Skeleton className="h-3 w-3 rounded bg-muted" />
        <Skeleton className="h-3 w-32 rounded bg-muted" />
      </View>

      {/* Specialist avatar stack */}
      <View className="px-4 flex-row items-center gap-1 mt-2 mb-3">
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            className="rounded-full bg-muted"
            style={{ width: 36, height: 36, marginLeft: i === 0 ? 0 : -8 }}
          />
        ))}
        <Skeleton className="h-3 w-24 rounded bg-muted ml-3" />
      </View>

      {/* Hero card */}
      <View className="px-4">
        <SkelCard>
          <View className="gap-2">
            <Skeleton className="h-6 w-3/4 rounded-lg bg-muted" />
            <Skeleton className="h-4 w-1/2 rounded-lg bg-muted" />
            <Skeleton className="h-3 w-1/3 rounded-lg bg-muted" />
          </View>
          <Skeleton className="h-11 w-full rounded-xl bg-muted" />
        </SkelCard>
      </View>

      {/* Details strip */}
      <View className="px-4 mt-4 flex-row flex-wrap gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-28 rounded-xl bg-muted" />
        ))}
      </View>

      {/* Overview section */}
      <View className="px-4 mt-6 gap-3">
        <Skeleton className="h-6 w-40 rounded-lg bg-muted" />
        <Skeleton className="h-px w-full rounded-lg bg-muted" />
        <Skeleton className="h-4 w-full rounded-lg bg-muted" />
        <Skeleton className="h-4 w-5/6 rounded-lg bg-muted" />
        <Skeleton className="h-4 w-4/6 rounded-lg bg-muted" />
        <View className="flex-row gap-3">
          <Skeleton className="h-24 flex-1 rounded-xl bg-muted" />
          <Skeleton className="h-24 flex-1 rounded-xl bg-muted" />
        </View>
      </View>

      {/* Specialist section */}
      <View className="px-4 mt-6 gap-3">
        <Skeleton className="h-6 w-48 rounded-lg bg-muted" />
        <Skeleton className="h-px w-full rounded-lg bg-muted" />
        <View className="flex-row gap-2">
          <Skeleton className="h-10 w-28 rounded-xl bg-muted" />
          <Skeleton className="h-10 w-28 rounded-xl bg-muted" />
        </View>
        <Skeleton className="h-44 w-full rounded-xl bg-muted" />
      </View>
    </ScrollView>
  );
}
