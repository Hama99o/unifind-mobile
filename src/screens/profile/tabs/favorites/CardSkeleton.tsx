/** Shared card skeleton for the Favorites tab sub-tabs. */
import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <View className="bg-card rounded-2xl border border-border p-4 mb-3 gap-2">
      <View className="flex-row gap-3">
        <Skeleton className="w-12 h-12 rounded-lg bg-muted" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-4 bg-muted rounded" />
          <Skeleton className="h-3 w-2/3 bg-muted rounded" />
        </View>
      </View>
      <Skeleton className="h-3 bg-muted rounded" />
      <Skeleton className="h-3 w-4/5 bg-muted rounded" />
      <View className="flex-row gap-2 mt-2">
        <Skeleton className="flex-1 h-9 bg-muted rounded-xl" />
        <Skeleton className="flex-1 h-9 bg-muted rounded-xl" />
      </View>
    </View>
  );
}
