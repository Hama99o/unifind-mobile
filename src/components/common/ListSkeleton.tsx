/**
 * ListSkeleton — placeholder skeleton for UniversalList loading state.
 * Split from UniversalList.tsx to keep that file under the 300-line cap.
 *
 * variant prop shapes the skeleton bones to match the card type:
 *   'program'     — two-line title + 3 meta chips + action row
 *   'institution' — logo placeholder + title + subtitle + badge row
 *   'offering'    — banner strip + avatar + title + price chip
 *   (default)     — generic tall card block
 */

import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export type ListSkeletonVariant = "program" | "institution" | "offering";

interface ListSkeletonProps {
  variant?: ListSkeletonVariant;
}

// ─── Per-variant bone shapes ──────────────────────────────────────────────────

function ProgramBone() {
  return (
    <View className="bg-card border border-border rounded-2xl p-4 gap-3">
      {/* Title lines */}
      <Skeleton className="h-5 w-3/4 rounded-lg bg-muted" />
      <Skeleton className="h-4 w-1/2 rounded-lg bg-muted" />
      {/* Meta chips row */}
      <View className="flex-row gap-2">
        <Skeleton className="h-6 w-20 rounded-full bg-muted" />
        <Skeleton className="h-6 w-16 rounded-full bg-muted" />
        <Skeleton className="h-6 w-24 rounded-full bg-muted" />
      </View>
      {/* Action row */}
      <Skeleton className="h-10 rounded-xl bg-muted" />
    </View>
  );
}

function InstitutionBone() {
  return (
    <View className="bg-card border border-border rounded-2xl p-4 gap-3">
      {/* Logo + title */}
      <View className="flex-row items-center gap-3">
        <Skeleton className="w-14 h-14 rounded-xl bg-muted" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-5 w-3/4 rounded-lg bg-muted" />
          <Skeleton className="h-4 w-1/2 rounded-lg bg-muted" />
        </View>
      </View>
      {/* Badge row */}
      <View className="flex-row gap-2">
        <Skeleton className="h-6 w-24 rounded-full bg-muted" />
        <Skeleton className="h-6 w-20 rounded-full bg-muted" />
      </View>
      {/* Action row */}
      <Skeleton className="h-10 rounded-xl bg-muted" />
    </View>
  );
}

function OfferingBone() {
  return (
    <View className="bg-card border border-border rounded-2xl overflow-hidden gap-0">
      {/* Banner strip */}
      <Skeleton className="h-28 w-full rounded-none bg-muted" />
      <View className="p-4 gap-3">
        {/* Avatar + title */}
        <View className="flex-row items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full bg-muted" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-5 w-2/3 rounded-lg bg-muted" />
            <Skeleton className="h-4 w-1/3 rounded-lg bg-muted" />
          </View>
        </View>
        {/* Price chip */}
        <Skeleton className="h-6 w-28 rounded-full bg-muted" />
        {/* Action row */}
        <Skeleton className="h-10 rounded-xl bg-muted" />
      </View>
    </View>
  );
}

function GenericBone({ opacity }: { opacity: number }) {
  return (
    <Skeleton
      className="bg-muted rounded-2xl h-52"
      style={{ opacity }}
    />
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ListSkeleton({ variant }: ListSkeletonProps = {}) {
  if (variant === "program") {
    return (
      <View className="px-4 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <ProgramBone key={i} />
        ))}
      </View>
    );
  }

  if (variant === "institution") {
    return (
      <View className="px-4 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <InstitutionBone key={i} />
        ))}
      </View>
    );
  }

  if (variant === "offering") {
    return (
      <View className="px-4 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <OfferingBone key={i} />
        ))}
      </View>
    );
  }

  // Default — generic blocks with fade
  return (
    <View className="px-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <GenericBone key={i} opacity={1 - i * 0.15} />
      ))}
    </View>
  );
}
