/**
 * AsyncBoundary — presentational wrapper for async loading/error/empty/data states.
 *
 * Rendering ladder:
 *   loading  → skeleton slot (or null)
 *   error    → error message + retry button
 *   isEmpty  → empty slot (or null)
 *   else     → children
 *
 * Props:
 *   loading   — show skeleton while true
 *   error     — error string; if non-null renders error+retry block
 *   onRetry   — called when the user taps Retry
 *   isEmpty?  — when true (and not loading/error) renders the empty slot
 *   skeleton? — React node to show while loading (defaults to null)
 *   empty?    — React node to show when isEmpty (defaults to null)
 *   children  — the success content
 */

import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

interface AsyncBoundaryProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  isEmpty?: boolean;
  skeleton?: React.ReactNode;
  empty?: React.ReactNode;
  children: React.ReactNode;
}

export function AsyncBoundary({
  loading,
  error,
  onRetry,
  isEmpty,
  skeleton,
  empty,
  children,
}: AsyncBoundaryProps) {
  const { t } = useCustomTranslation();

  if (loading) {
    return skeleton != null ? <>{skeleton}</> : null;
  }

  if (error) {
    return (
      <View className="items-center gap-3 py-8">
        <Text className="text-destructive text-center">{error}</Text>
        <Button label={t("common.retry")} onPress={onRetry} action="primary" />
      </View>
    );
  }

  if (isEmpty) {
    return empty != null ? <>{empty}</> : null;
  }

  return <>{children}</>;
}
