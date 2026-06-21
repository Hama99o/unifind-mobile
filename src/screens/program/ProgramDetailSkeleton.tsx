/**
 * ProgramDetailSkeleton — loading skeleton for the program detail screen.
 * Shape matches: hero card + quick-facts bar + section rows.
 * No blank screen while data loads.
 */

import { View } from "react-native";
import { ScrollView } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

function SkeletonRow() {
  return (
    <View className="flex-row gap-3 mb-3">
      <View className="w-10 h-10 rounded-full bg-muted" />
      <View className="flex-1 gap-2">
        <Skeleton className="w-1/3 rounded-lg bg-muted" style={{ height: 10 }} />
        <Skeleton className="w-2/3 rounded-lg bg-muted" style={{ height: 14 }} />
      </View>
    </View>
  );
}

export function ProgramDetailSkeleton() {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Hero card */}
      <View className="mx-4 mt-4 bg-card rounded-2xl shadow-sm border border-border p-4 gap-3">
        <View className="flex-row items-start gap-3">
          <View className="w-20 h-16 rounded-xl bg-muted" />
          <View className="flex-1 gap-2">
            <Skeleton className="w-3/4 rounded-lg bg-muted" style={{ height: 16 }} />
            <Skeleton className="w-1/2 rounded-lg bg-muted" style={{ height: 12 }} />
            <Skeleton className="w-1/3 rounded-lg bg-muted" style={{ height: 12 }} />
          </View>
        </View>
        <Skeleton className="w-full rounded-lg bg-muted" style={{ height: 44 }} />
        <View className="flex-row gap-2">
          <Skeleton className="flex-1 rounded-lg bg-muted" style={{ height: 36 }} />
          <Skeleton className="flex-1 rounded-lg bg-muted" style={{ height: 36 }} />
        </View>
      </View>

      {/* Quick-facts bar */}
      <View className="mx-4 mt-3 bg-card rounded-xl border border-border p-4">
        <View className="flex-row flex-wrap gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} className="gap-1 w-[45%]">
              <Skeleton className="w-3/4 rounded-lg bg-muted" style={{ height: 10 }} />
              <Skeleton className="w-full rounded-lg bg-muted" style={{ height: 14 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Sections */}
      {[1, 2, 3].map((s) => (
        <View key={s} className="mx-4 mt-4 gap-3">
          <Skeleton className="w-1/2 rounded-lg bg-muted" style={{ height: 18 }} />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ))}
      <View className="h-16" />
    </ScrollView>
  );
}
