/**
 * CheckoutSkeleton — loading skeleton for the checkout screen.
 * Shows placeholder shapes matching the real content layout.
 */

import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export function CheckoutSkeleton() {
  return (
    <View className="gap-4 px-4 pt-4">
      <Skeleton className="h-6 w-56 bg-muted rounded-lg" />
      <Skeleton className="h-40 bg-muted rounded-2xl" />
      <Skeleton className="h-24 bg-muted rounded-2xl" />
      <Skeleton className="h-20 bg-muted rounded-2xl" />
      <Skeleton className="h-28 bg-muted rounded-2xl" />
      <Skeleton className="h-14 bg-muted rounded-2xl" />
    </View>
  );
}
