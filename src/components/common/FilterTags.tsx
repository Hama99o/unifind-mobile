/**
 * FilterTags — removable chip row for active filters.
 * Mirrors web UFFilterTags.
 * FILTER_DRAWER.md §Behaviour is the authoritative spec.
 *
 * Accepts optionsByKey (resolved async options from FilterDrawer) so chips
 * show human-readable labels instead of raw IDs.
 */

import { ScrollView, View, Pressable } from "react-native";
import { X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import type { FilterValues, FilterConfig, FilterOption, RangeValue } from "@/components/common/FilterDrawer";

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

    // Range filter — show as "minVal — maxVal" chip using localized numbers.
    // When unit is "$" use formatCurrency; otherwise use formatNumber.
    if (fc.type === "range") {
      const rangeVal = selected as RangeValue;
      if (Array.isArray(rangeVal) && typeof rangeVal[0] === "number") {
        const formatRangeVal = (v: number): string => {
          if (fc.unit === "$") return formatCurrency(v, "USD");
          const n = formatNumber(v);
          return fc.unit ? `${fc.unit}${n}` : n;
        };
        chips.push({
          key: fc.key,
          value: "__range__",
          label: `${formatRangeVal(rangeVal[0])} — ${formatRangeVal(rangeVal[1])}`,
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

      // selected is string[] here (range type was handled above; booleans are not arrays)
      const stringVals = (selected as string[]).filter(
        (v): v is string => typeof v === "string"
      );
      for (const val of stringVals) {
        const opt = allOptions.find((o) => o.value === val);
        chips.push({
          key: fc.key,
          value: val,
          // If async options are not yet loaded, fall back to fc.label prefix
          // rather than showing raw IDs
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
          className="flex-row items-center gap-1.5 bg-lightgreen border border-secondary rounded-full px-3 py-2"
        >
          <Text className="text-xs font-medium text-foreground" numberOfLines={1}>
            {chip.label}
          </Text>
          {/* X is visual-only — the whole chip is the tap target */}
          <X size={12} color={colors.foreground} />
        </Pressable>
      ))}

      {/* Clear all chip */}
      {chips.length > 1 && (
        <Pressable
          onPress={onClearAll}
          className="flex-row items-center gap-1 bg-muted rounded-full px-3 py-1.5 border border-border"
          hitSlop={4}
        >
          <Text className="text-xs text-muted-foreground">{t("clearSelection")}</Text>
          <X size={11} color={colors.mutedForeground} />
        </Pressable>
      )}
    </ScrollView>
  );
}
