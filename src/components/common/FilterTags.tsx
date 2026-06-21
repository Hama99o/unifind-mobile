/**
 * FilterTags — removable chip row for active filters.
 * Redesigned to match web UFFilterTags mobile variant:
 *
 *   Each chip: transparent bg · teal (#44DED1/secondary) border · teal text
 *   Clear All chip: turquoise (secondary) bg · teal border
 *   X icon: primary (prussian) color
 *
 * Shows all chips (no max-3 cap on mobile — horizontal scroll handles overflow).
 * Accepts optionsByKey so chips show human-readable labels instead of raw IDs.
 */

import { ScrollView, View, Pressable } from "react-native";
import { X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import type {
  FilterValues,
  FilterConfig,
  FilterOption,
  RangeValue,
} from "@/components/common/FilterDrawer";

interface Props {
  filterValues: FilterValues;
  filterConfig: FilterConfig[];
  onRemove: (key: string, value?: string) => void;
  onClearAll: () => void;
  /** Resolved async options keyed by filter key — provided by FilterDrawer/screen */
  optionsByKey?: Record<string, FilterOption[]>;
}

export function FilterTags({
  filterValues,
  filterConfig,
  onRemove,
  onClearAll,
  optionsByKey,
}: Props) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const { formatNumber, formatCurrency } = useLocalization();

  // Build flat list of active chips
  const chips: Array<{ key: string; value: string; label: string }> = [];

  for (const fc of filterConfig) {
    const selected = filterValues[fc.key];
    if (!selected) continue;

    // Range filter — show as "Min: X - Max: Y" chip (mirrors web tag format)
    if (fc.type === "range") {
      const rangeVal = selected as RangeValue;
      if (Array.isArray(rangeVal) && typeof rangeVal[0] === "number") {
        const fmt = (v: number): string => {
          if (fc.unit === "$") return formatCurrency(v, "USD");
          const n = formatNumber(v);
          return fc.unit ? `${fc.unit}${n}` : n;
        };
        chips.push({
          key: fc.key,
          value: "__range__",
          label: `${fmt(rangeVal[0])} — ${fmt(rangeVal[1])}`,
        });
      }
      continue;
    }

    if (Array.isArray(selected) && selected.length > 0) {
      // Merge static options with async-resolved options for label lookup
      const allOptions: FilterOption[] = [
        ...(fc.options ?? []),
        ...(optionsByKey?.[fc.key] ?? []),
      ];

      const stringVals = (selected as string[]).filter(
        (v): v is string => typeof v === "string"
      );
      for (const val of stringVals) {
        const opt = allOptions.find((o) => o.value === val);
        chips.push({
          key: fc.key,
          value: val,
          label: opt?.label ?? fc.label,
        });
      }
    }
  }

  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap: 8,
        flexDirection: isRtl ? "row-reverse" : "row",
        alignItems: "center",
      }}
      className="py-1"
    >
      {chips.map((chip) => (
        <Pressable
          key={`${chip.key}:${chip.value}`}
          onPress={() => onRemove(chip.key, chip.value)}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${chip.label} filter`}
          // Mobile chip: transparent bg + secondary (teal) border
          style={{
            flexDirection: isRtl ? "row-reverse" : "row",
            alignItems: "center",
            gap: 4,
            borderWidth: 1,
            borderColor: colors.secondary,
            borderRadius: 999,
            paddingHorizontal: 10,
            height: 28,
            backgroundColor: "transparent",
          }}
        >
          {/* Mobile chip text: teal (secondary) — matches web #91C8C8 muted-teal */}
          <Text
            style={{ color: colors.secondary, fontSize: 12 }}
            numberOfLines={1}
          >
            {chip.label}
          </Text>
          <X size={12} color={colors.primary} />
        </Pressable>
      ))}

      {/* Clear All chip — turquoise (secondary) bg, matching web "Clear All" */}
      {chips.length > 1 && (
        <Pressable
          onPress={onClearAll}
          hitSlop={4}
          accessibilityRole="button"
          style={{
            flexDirection: isRtl ? "row-reverse" : "row",
            alignItems: "center",
            gap: 4,
            borderWidth: 1,
            borderColor: colors.secondary,
            borderRadius: 999,
            paddingHorizontal: 10,
            height: 28,
            backgroundColor: colors.secondary,
          }}
        >
          <Text
            style={{ color: colors.primary, fontSize: 12 }}
            numberOfLines={1}
          >
            {t("clear_all_filters")}
          </Text>
          <X size={12} color={colors.primary} />
        </Pressable>
      )}
    </ScrollView>
  );
}
