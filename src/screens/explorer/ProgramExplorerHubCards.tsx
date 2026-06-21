/**
 * ProgramExplorerHubCards — tile grid cards for the Program Explorer hub.
 * Split from ProgramExplorerHubScreen to stay under ~300 lines per file.
 *
 * Renders:
 *   - FieldsGrid: FA-icon-mapped lucide icon + label + count via HubTile
 *   - DegreesGrid: graduation-cap icon + label + count via HubTile
 *   - 2-column grid with loading skeleton (Skeleton) + empty state
 *
 * Batch A: ExplorerTile replaced by shared HubTile; TileSkeleton uses
 * the Skeleton primitive instead of animate-pulse.
 */

import React from "react";
import { View } from "react-native";
import { GraduationCap } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { faIconToLucide } from "@/utils/faIconToLucide";
import { HubTile } from "@/components/shared/HubTile";
import type { FieldWithIconItem, DegreeItem } from "@/api/programExplorerApi";

// ─── Skeleton tile ────────────────────────────────────────────────────────────

function TileSkeleton() {
  return (
    <Skeleton
      className="bg-muted rounded-2xl"
      style={{ minHeight: 100 }}
    />
  );
}

export function TileGridSkeleton() {
  return (
    <View className="flex-row flex-wrap gap-3 px-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={{ width: "47%" }}>
          <TileSkeleton />
        </View>
      ))}
    </View>
  );
}

// ─── Tile width ───────────────────────────────────────────────────────────────

const TILE_STYLE = { width: "47%" } as const;

// ─── Fields grid ──────────────────────────────────────────────────────────────

interface FieldsGridProps {
  items: FieldWithIconItem[];
  search: string;
  onPress: (fieldName: string) => void;
  loading: boolean;
  isRtl: boolean;
}

export function FieldsGrid({
  items,
  search,
  onPress,
  loading,
}: FieldsGridProps) {
  const { t } = useCustomTranslation();
  const colors = useColors();

  if (loading) return <TileGridSkeleton />;

  const filtered = search
    ? items.filter((f) =>
        f.fieldOfStudy.name.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  if (filtered.length === 0) {
    return (
      <View className="items-center py-8 px-4">
        <Text className="text-muted-foreground text-sm text-center">
          {t("common.empty")}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-3 px-4">
      {filtered.map((item) => {
        const Icon = faIconToLucide(item.fieldOfStudy.icon);
        return (
          <HubTile
            key={item.fieldOfStudy.id}
            label={item.fieldOfStudy.name}
            count={item.count}
            icon={Icon}
            iconColor={colors.primary}
            onPress={() => onPress(item.fieldOfStudy.name)}
            style={TILE_STYLE}
          />
        );
      })}
    </View>
  );
}

// ─── Degrees grid ─────────────────────────────────────────────────────────────

interface DegreesGridProps {
  items: DegreeItem[];
  search: string;
  onPress: (degreeTitle: string) => void;
  loading: boolean;
  isRtl: boolean;
}

export function DegreesGrid({
  items,
  search,
  onPress,
  loading,
}: DegreesGridProps) {
  const { t } = useCustomTranslation();
  const colors = useColors();

  if (loading) return <TileGridSkeleton />;

  const safeItems = Array.isArray(items) ? items : [];
  const filtered = search
    ? safeItems.filter((d) =>
        d.degree.title.toLowerCase().includes(search.toLowerCase())
      )
    : safeItems;

  if (filtered.length === 0) {
    return (
      <View className="items-center py-8 px-4">
        <Text className="text-muted-foreground text-sm text-center">
          {t("common.empty")}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-3 px-4">
      {filtered.map((item) => (
        <HubTile
          key={item.degree.id}
          label={item.degree.title}
          count={item.count}
          icon={GraduationCap}
          iconColor={colors.primary}
          onPress={() => onPress(item.degree.title)}
          style={TILE_STYLE}
        />
      ))}
    </View>
  );
}
