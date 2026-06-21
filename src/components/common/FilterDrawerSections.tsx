/**
 * FilterDrawerSections — sub-components for FilterDrawer (split for line limit).
 * Internal use only; exported for FilterDrawer.tsx.
 *
 * Components:
 *   AccordionSection — collapsible section header + body
 *   RangePicker      — single-select from a list of range options
 *   RangeSliderFilter — dual-thumb range filter (min/max with step)
 */

import React from "react";
import { View, Pressable, Platform } from "react-native";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import type { FilterOption, RangeValue } from "@/components/common/FilterDrawer";

// ─── AccordionSection ─────────────────────────────────────────────────────────

interface AccordionSectionProps {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isRtl: boolean;
}

export function AccordionSection({
  label,
  expanded,
  onToggle,
  children,
  isRtl,
}: AccordionSectionProps) {
  const colors = useColors();
  const ChevronCollapsed = isRtl ? ChevronLeft : ChevronRight;
  const Icon = expanded ? ChevronDown : ChevronCollapsed;

  return (
    <View className="border-b border-border">
      <Pressable
        onPress={onToggle}
        className={`flex-row items-center justify-between px-4 py-3.5 active:bg-muted ${isRtl ? "flex-row-reverse" : ""}`}
        accessibilityRole="button"
      >
        <Text className="font-semibold text-foreground">{label}</Text>
        <Icon size={18} color={colors.mutedForeground} />
      </Pressable>
      {expanded && <View className="px-4 pb-3 gap-2">{children}</View>}
    </View>
  );
}

// ─── RangePicker (single-select from a list of ranges) ───────────────────────

interface RangePickerProps {
  options: FilterOption[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
  unit?: string;
  isLoading?: boolean;
  emptyLabel?: string;
}

export function RangePicker({
  options,
  selectedValue,
  onSelect,
  unit,
  isLoading,
  emptyLabel,
}: RangePickerProps) {
  const { t } = useCustomTranslation();

  if (isLoading) {
    return (
      <Text className="text-sm text-muted-foreground py-2">{t("common.loading")}</Text>
    );
  }

  if (options.length === 0) {
    return (
      <Text className="text-sm text-muted-foreground py-2">
        {emptyLabel ?? t("filter.noOptions")}
      </Text>
    );
  }

  return (
    <View className="gap-2">
      {options.map((opt) => {
        const isSelected = selectedValue === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(isSelected ? null : opt.value)}
            className={`flex-row items-center justify-between px-3 py-2.5 rounded-lg border ${
              isSelected ? "border-secondary bg-lightgreen" : "border-border bg-card"
            } active:bg-muted`}
          >
            <Text
              className={`text-sm ${isSelected ? "font-semibold text-foreground" : "text-foreground"}`}
            >
              {opt.label}
              {unit ? ` ${unit}` : ""}
            </Text>
            {opt.count !== undefined && (
              <Text className="text-xs text-muted-foreground">({opt.count})</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── RangeSliderFilter (dual-thumb range filter) ──────────────────────────────

interface RangeSliderFilterProps {
  minBound: number;
  maxBound: number;
  step: number;
  /** When unit is "$" formatCurrency is used; otherwise formatNumber. */
  unit?: string;
  value: RangeValue;
  onChange: (range: RangeValue) => void;
  isRtl: boolean;
}

/**
 * Dual-thumb range filter using @react-native-community/slider.
 * Renders two sliders (one for min, one for max) with value labels.
 * Generic/reusable — used by programs (tuition) and offerings (price).
 *
 * Note: @react-native-community/slider must be installed.
 * If not available (e.g. web preview), falls back to text display.
 *
 * Numbers are formatted via useLocalization (formatCurrency for "$", formatNumber otherwise).
 */
export function RangeSliderFilter({
  minBound,
  maxBound,
  step,
  unit = "",
  value,
  onChange,
  isRtl,
}: RangeSliderFilterProps) {
  const colors = useColors();
  const { t } = useCustomTranslation();
  const { formatNumber, formatCurrency } = useLocalization();
  const [minVal, maxVal] = value;

  const formatVal = (v: number): string => {
    if (unit === "$") return formatCurrency(v, "USD");
    const formatted = formatNumber(v);
    return unit ? `${unit}${formatted}` : formatted;
  };

  // Try to load Slider; if package not yet installed, fall back gracefully
  let SliderComponent: React.ComponentType<{
    style?: object;
    minimumValue: number;
    maximumValue: number;
    step: number;
    value: number;
    onValueChange: (v: number) => void;
    minimumTrackTintColor: string;
    maximumTrackTintColor: string;
    thumbTintColor: string;
  }> | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    SliderComponent = require("@react-native-community/slider").default;
  } catch {
    SliderComponent = null;
  }

  if (!SliderComponent) {
    // On web: render HTML number inputs so the filter remains interactive.
    // On native without the package: show read-only value labels.
    if (Platform.OS === "web") {
      return (
        <View className="gap-3 py-2">
          <View className={`flex-row items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Text className="text-sm text-muted-foreground w-10">{t("filter.min")}</Text>
            {React.createElement("input", {
              type: "number",
              min: minBound,
              max: maxVal - step,
              step,
              value: minVal,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const v = Math.min(Number(e.target.value), maxVal - step);
                onChange([Math.max(v, minBound), maxVal]);
              },
              style: {
                flex: 1,
                height: 36,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: "0 8px",
                fontSize: 13,
                outline: "none",
              },
            })}
            <Text className="text-xs text-foreground font-medium">{formatVal(minVal)}</Text>
          </View>
          <View className={`flex-row items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Text className="text-sm text-muted-foreground w-10">{t("filter.max")}</Text>
            {React.createElement("input", {
              type: "number",
              min: minVal + step,
              max: maxBound,
              step,
              value: maxVal,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const v = Math.max(Number(e.target.value), minVal + step);
                onChange([minVal, Math.min(v, maxBound)]);
              },
              style: {
                flex: 1,
                height: 36,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: "0 8px",
                fontSize: 13,
                outline: "none",
              },
            })}
            <Text className="text-xs text-foreground font-medium">{formatVal(maxVal)}</Text>
          </View>
        </View>
      );
    }

    // Native without the package installed — show value labels only
    return (
      <View className="gap-3 py-2">
        <View
          className={`flex-row items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <Text className="text-sm text-muted-foreground">{t("filter.min")}</Text>
          <Text className="text-sm font-semibold text-foreground">
            {formatVal(minVal)}
          </Text>
        </View>
        <View
          className={`flex-row items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <Text className="text-sm text-muted-foreground">{t("filter.max")}</Text>
          <Text className="text-sm font-semibold text-foreground">
            {formatVal(maxVal)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-4 py-2">
      {/* Value display */}
      <View
        className={`flex-row items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}
      >
        <View
          className="bg-lightgreen rounded-lg px-3 py-1.5 border border-secondary/30"
        >
          <Text className="text-sm font-semibold text-foreground">
            {formatVal(minVal)}
          </Text>
        </View>
        <Text className="text-sm text-muted-foreground">—</Text>
        <View
          className="bg-lightgreen rounded-lg px-3 py-1.5 border border-secondary/30"
        >
          <Text className="text-sm font-semibold text-foreground">
            {formatVal(maxVal)}
          </Text>
        </View>
      </View>

      {/* Min slider */}
      <View>
        <Text className="text-xs text-muted-foreground mb-1">{t("filter.min")}</Text>
        <SliderComponent
          style={{ width: "100%", height: 32 }}
          minimumValue={minBound}
          maximumValue={maxBound}
          step={step}
          value={minVal}
          onValueChange={(v: number) => {
            // Clamp so min never exceeds max
            const clamped = Math.min(v, maxVal - step);
            onChange([clamped, maxVal]);
          }}
          minimumTrackTintColor={colors.secondary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.secondary}
        />
      </View>

      {/* Max slider */}
      <View>
        <Text className="text-xs text-muted-foreground mb-1">{t("filter.max")}</Text>
        <SliderComponent
          style={{ width: "100%", height: 32 }}
          minimumValue={minBound}
          maximumValue={maxBound}
          step={step}
          value={maxVal}
          onValueChange={(v: number) => {
            // Clamp so max never goes below min
            const clamped = Math.max(v, minVal + step);
            onChange([minVal, clamped]);
          }}
          minimumTrackTintColor={colors.border}
          maximumTrackTintColor={colors.secondary}
          thumbTintColor={colors.secondary}
        />
      </View>
    </View>
  );
}
