/**
 * FilterDrawerRange — RangePicker + RangeSliderFilter.
 * Split from FilterDrawerInputs.tsx to stay under the 300-line cap.
 * Internal use only; imported by FilterDrawerBody.tsx.
 *
 * RangePicker:       Single-select pill list (institution singleSelect tuition ranges).
 *
 * RangeSliderFilter: Two-thumb range slider (min + max) matching web type-C:
 *   • Sliders with prussian track on selected range
 *   • Current-range display pills (lightgreen bg)
 *   • Min + Max TextInputs bidirectionally synced on blur
 *   • Error text when min > max
 *   • Graceful fallback: web uses HTML number inputs, native-without-package
 *     falls back to TextInput-only (no slider visual)
 */

import React, { useState } from "react";
import { View, Pressable, Platform, TextInput } from "react-native";
import { Text } from "@/components/ui/text";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import type { FilterOption, RangeValue } from "@/components/common/FilterDrawer";

// ─── RangePicker ──────────────────────────────────────────────────────────────

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
              isSelected ? "border-primary bg-lightgreen" : "border-border bg-card"
            } active:bg-muted`}
          >
            <Text
              className={`text-sm ${
                isSelected ? "font-semibold text-foreground" : "text-foreground"
              }`}
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

// ─── RangeSliderFilter ────────────────────────────────────────────────────────

interface RangeSliderFilterProps {
  minBound: number;
  maxBound: number;
  step: number;
  /** "$" → formatCurrency(USD); otherwise formatNumber + prepend unit */
  unit?: string;
  value: RangeValue;
  onChange: (range: RangeValue) => void;
  isRtl: boolean;
}

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

  const [minInput, setMinInput] = useState(String(minVal));
  const [maxInput, setMaxInput] = useState(String(maxVal));

  React.useEffect(() => { setMinInput(String(minVal)); }, [minVal]);
  React.useEffect(() => { setMaxInput(String(maxVal)); }, [maxVal]);

  const hasError = minVal > maxVal;

  const fmt = (v: number): string => {
    if (unit === "$") return formatCurrency(v, "USD");
    const n = formatNumber(v);
    return unit ? `${unit}${n}` : n;
  };

  const commitMin = () => {
    const v = parseInt(minInput, 10);
    if (!isNaN(v)) {
      const c = Math.max(minBound, Math.min(v, maxBound));
      setMinInput(String(c));
      onChange([c, maxVal]);
    } else { setMinInput(String(minVal)); }
  };

  const commitMax = () => {
    const v = parseInt(maxInput, 10);
    if (!isNaN(v)) {
      const c = Math.max(minBound, Math.min(v, maxBound));
      setMaxInput(String(c));
      onChange([minVal, c]);
    } else { setMaxInput(String(maxVal)); }
  };

  const inputStyle = (error: boolean) => ({
    height: 40, borderWidth: 1,
    borderColor: error ? colors.destructive : colors.border,
    borderRadius: 8, paddingHorizontal: 10, fontSize: 13, color: colors.foreground,
  });

  let Slider: React.ComponentType<{
    style?: object;
    minimumValue: number; maximumValue: number; step: number; value: number;
    onValueChange: (v: number) => void;
    minimumTrackTintColor: string; maximumTrackTintColor: string; thumbTintColor: string;
  }> | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Slider = require("@react-native-community/slider").default;
  } catch { Slider = null; }

  // Min+Max inputs (reused in all branches)
  const textInputs = (
    <View className={`flex-row items-end gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
      <View className="flex-1 gap-1">
        <Text className="text-xs font-medium text-foreground">{t("filter.min")}</Text>
        {Platform.OS === "web" ? (
          React.createElement("input", {
            type: "number", min: minBound, max: maxBound, step, value: minInput,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setMinInput(e.target.value),
            onBlur: commitMin,
            style: { width: "100%", height: 36, border: `1px solid ${hasError ? colors.destructive : colors.border}`, borderRadius: 8, padding: "0 8px", fontSize: 13, outline: "none", color: colors.foreground },
          })
        ) : (
          <TextInput value={minInput} onChangeText={setMinInput} onBlur={commitMin}
            keyboardType="number-pad" style={inputStyle(hasError)} />
        )}
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-xs font-medium text-foreground">{t("filter.max")}</Text>
        {Platform.OS === "web" ? (
          React.createElement("input", {
            type: "number", min: minBound, max: maxBound, step, value: maxInput,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setMaxInput(e.target.value),
            onBlur: commitMax,
            style: { width: "100%", height: 36, border: `1px solid ${hasError ? colors.destructive : colors.border}`, borderRadius: 8, padding: "0 8px", fontSize: 13, outline: "none", color: colors.foreground },
          })
        ) : (
          <TextInput value={maxInput} onChangeText={setMaxInput} onBlur={commitMax}
            keyboardType="number-pad" style={inputStyle(hasError)} />
        )}
      </View>
    </View>
  );

  // No slider package — text inputs only
  if (!Slider) {
    return (
      <View className="gap-3 py-2">
        {textInputs}
        {hasError && (
          <Text className="text-xs text-destructive">{t("filter.maxLessThanMin")}</Text>
        )}
      </View>
    );
  }

  // Full slider + display pills + text inputs
  return (
    <View className="gap-2 py-2">
      {/* Current range display */}
      <View className={`flex-row items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
        <View className="bg-lightgreen rounded-lg px-3 py-1.5 border border-primary/20">
          <Text className="text-sm font-semibold text-foreground">{fmt(minVal)}</Text>
        </View>
        <Text className="text-sm text-muted-foreground">—</Text>
        <View className="bg-lightgreen rounded-lg px-3 py-1.5 border border-primary/20">
          <Text className="text-sm font-semibold text-foreground">{fmt(maxVal)}</Text>
        </View>
      </View>

      {/* Min thumb */}
      <View>
        <Text className="text-xs text-muted-foreground mb-1">{t("filter.min")}</Text>
        <Slider style={{ width: "100%", height: 32 }}
          minimumValue={minBound} maximumValue={maxBound} step={step} value={minVal}
          onValueChange={(v: number) => onChange([Math.max(Math.min(v, maxVal - step), minBound), maxVal])}
          minimumTrackTintColor={colors.border}
          maximumTrackTintColor={colors.primary}
          thumbTintColor={colors.primary}
        />
      </View>

      {/* Max thumb */}
      <View>
        <Text className="text-xs text-muted-foreground mb-1">{t("filter.max")}</Text>
        <Slider style={{ width: "100%", height: 32 }}
          minimumValue={minBound} maximumValue={maxBound} step={step} value={maxVal}
          onValueChange={(v: number) => onChange([minVal, Math.min(Math.max(v, minVal + step), maxBound)])}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
      </View>

      {/* Bidirectional text inputs */}
      <View className="mt-1">{textInputs}</View>

      {hasError && (
        <Text className="text-xs text-destructive">{t("filter.maxLessThanMin")}</Text>
      )}
    </View>
  );
}
