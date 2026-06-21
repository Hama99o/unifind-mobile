/**
 * GrowthCenterHubCards — reusable grid cards for category + field grids.
 * Split from GrowthCenterScreen to respect the ~300-line file cap.
 *
 * Batch C: HubCard replaced by shared HubTile; Spinner loading states
 * replaced by TileGridSkeleton (Skeleton-based, no bare spinners).
 */

import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { faIconToLucide } from "@/utils/faIconToLucide";
import { HubTile } from "@/components/shared/HubTile";
import { TileGridSkeleton } from "@/screens/explorer/ProgramExplorerHubCards";
import type { CategoryUsageItem, FieldUsageItem } from "@/api/offeringsFilterApi";

// ─── Category grid ────────────────────────────────────────────────────────────

interface CategoryGridProps {
  items: CategoryUsageItem[];
  search: string;
  onPress: (categoryId: string, name: string) => void;
  loading?: boolean;
}

export function CategoryGrid({ items, search, onPress, loading }: CategoryGridProps) {
  const { t } = useCustomTranslation();
  const colors = useColors();
  const filtered = search
    ? items.filter((c) => c.category.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  if (loading) {
    return <TileGridSkeleton />;
  }

  if (filtered.length === 0) {
    return (
      <Text className="text-muted-foreground text-sm px-4 py-2">
        {t("common.empty")}
      </Text>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-3 px-4">
      {filtered.map((item, i) => (
        <HubTile
          key={`cat-${item.category.id}-${i}`}
          label={item.category.name}
          count={item.offerings.length}
          icon={faIconToLucide(item.category.icon)}
          iconColor={colors.primary}
          onPress={() => onPress(String(item.category.id), item.category.name)}
          style={{ width: "47%" }}
        />
      ))}
    </View>
  );
}

// ─── Field grid ───────────────────────────────────────────────────────────────

interface FieldGridProps {
  items: FieldUsageItem[];
  search: string;
  onPress: (fieldOfferings: number[], name: string) => void;
  loading?: boolean;
}

export function FieldGrid({ items, search, onPress, loading }: FieldGridProps) {
  const { t } = useCustomTranslation();
  const colors = useColors();
  const filtered = search
    ? items.filter((f) => f.field.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  if (loading) {
    return <TileGridSkeleton />;
  }

  if (filtered.length === 0) {
    return (
      <Text className="text-muted-foreground text-sm px-4 py-2">
        {t("common.empty")}
      </Text>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-3 px-4">
      {filtered.map((item, i) => (
        <HubTile
          key={`field-${item.field.id}-${i}`}
          label={item.field.name}
          count={item.offerings.length}
          icon={faIconToLucide(item.field.icon)}
          iconColor={colors.primary}
          onPress={() => onPress(item.offerings, item.field.name)}
          style={{ width: "47%" }}
        />
      ))}
    </View>
  );
}

// ─── Specialists tab (disabled, coming soon) ──────────────────────────────────

const SPECIALIST_SKILLS = [
  "application_navigation_process",
  "business_presentation",
  "career_counseling",
  "communication_skills",
  "content_creation",
  "cv_writing",
  "data_analysis",
  "design_skills",
];

export function SpecialistsComingSoon() {
  const { t } = useCustomTranslation();
  return (
    <View className="flex-row flex-wrap gap-3 px-4 py-4">
      {SPECIALIST_SKILLS.map((key) => (
        <View
          key={key}
          className="flex-1 min-w-[44%] bg-muted border border-border rounded-2xl p-4 items-center justify-center opacity-50"
          style={{ minHeight: 90 }}
        >
          <Text className="text-muted-foreground text-sm font-semibold text-center" numberOfLines={2}>
            {t(key)}
          </Text>
        </View>
      ))}
      <View className="w-full items-center py-4">
        <Text className="text-muted-foreground text-sm">{t("common.comingSoon")}</Text>
      </View>
    </View>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

export function SectionHeading({ title }: { title: string }) {
  return (
    <Heading size="sm" className="text-foreground px-4 pt-5 pb-2">
      {title}
    </Heading>
  );
}
