/**
 * InstitutionDetailSkeleton — Loading skeleton for the Institution Detail screen.
 *
 * Shape matches the real content to prevent layout pop.
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

export function InstitutionDetailSkeleton() {
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Hero cover */}
      <Skeleton className="h-40 w-full rounded-none bg-muted" />

      {/* Hero card */}
      <View className="px-4 -mt-8">
        <SkelCard>
          <View className="flex-row gap-4 mt-10">
            <Skeleton className="w-20 rounded-xl bg-muted" style={{ height: 68 }} />
            <View className="flex-1 gap-2">
              <Skeleton className="h-5 w-3/4 rounded-lg bg-muted" />
              <Skeleton className="h-4 w-1/2 rounded-lg bg-muted" />
              <Skeleton className="h-3 w-1/3 rounded-lg bg-muted" />
            </View>
          </View>
          <Skeleton className="h-10 w-full rounded-xl bg-muted" />
          <View className="flex-row gap-2">
            <Skeleton className="h-9 flex-1 rounded-xl bg-muted" />
            <Skeleton className="h-9 flex-1 rounded-xl bg-muted" />
          </View>
        </SkelCard>
      </View>

      {/* Stats row */}
      <View className="mx-4 mt-3">
        <SkelCard>
          <View className="flex-row gap-4">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="gap-1">
                <Skeleton className="h-2 w-16 rounded-lg bg-muted" />
                <Skeleton className="h-3 w-20 rounded-lg bg-muted" />
              </View>
            ))}
          </View>
        </SkelCard>
      </View>

      <View className="px-4 gap-6 pt-6">
        {/* Overview */}
        <View className="gap-3">
          <Skeleton className="h-6 w-32 rounded-lg bg-muted" />
          <Skeleton className="h-px w-full rounded-lg bg-muted" />
          <Skeleton className="h-4 w-full rounded-lg bg-muted" />
          <Skeleton className="h-4 w-5/6 rounded-lg bg-muted" />
          <Skeleton className="h-4 w-4/5 rounded-lg bg-muted" />
          <View className="gap-2">
            {[1, 2, 3].map((i) => (
              <SkelCard key={i}>
                <View className="flex-row gap-3">
                  <Skeleton className="w-10 h-10 rounded-full bg-muted" />
                  <View className="flex-1 gap-1">
                    <Skeleton className="h-4 w-2/3 rounded-lg bg-muted" />
                    <Skeleton className="h-3 w-full rounded-lg bg-muted" />
                  </View>
                </View>
              </SkelCard>
            ))}
          </View>
        </View>

        {/* Academic */}
        <View className="gap-3">
          <Skeleton className="h-6 w-48 rounded-lg bg-muted" />
          <Skeleton className="h-px w-full rounded-lg bg-muted" />
          <View className="flex-row gap-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-full bg-muted" />)}
          </View>
          {[1, 2].map((i) => (
            <SkelCard key={i}>
              <Skeleton className="h-4 w-3/4 rounded-lg bg-muted" />
              <Skeleton className="h-3 w-1/2 rounded-lg bg-muted" />
            </SkelCard>
          ))}
        </View>

        {/* Reviews */}
        <View className="gap-3">
          <Skeleton className="h-6 w-24 rounded-lg bg-muted" />
          <Skeleton className="h-px w-full rounded-lg bg-muted" />
          <SkelCard>
            <View className="flex-row gap-6">
              <View className="gap-2 items-center">
                <Skeleton className="h-3 w-24 rounded-lg bg-muted" />
                <Skeleton className="h-12 w-16 rounded-lg bg-muted" />
                <Skeleton className="h-4 w-20 rounded-lg bg-muted" />
              </View>
              <View className="flex-1 gap-1">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-2 w-full rounded-lg bg-muted" />)}
              </View>
            </View>
          </SkelCard>
        </View>
      </View>
    </ScrollView>
  );
}
