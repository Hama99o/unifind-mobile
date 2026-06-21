/**
 * PlaceholderTab — temporary holder for Slice-2 tabs:
 * Activity, Favorites, Comparisons, Bookings.
 *
 * Shows an EmptyState with the tab name. Slice 2 will replace this.
 */

import { View } from "react-native";
import { EmptyState } from "@/components/shared/EmptyState";

interface PlaceholderTabProps {
  title: string;
  description?: string;
}

export function PlaceholderTab({ title, description }: PlaceholderTabProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <EmptyState
        title={title}
        description={description ?? ""}
      />
    </View>
  );
}
