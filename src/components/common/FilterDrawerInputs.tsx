/**
 * FilterDrawerInputs — LocationGroup filter input.
 * Split from FilterDrawerSections.tsx to stay under the 300-line cap.
 * Internal use only; imported by FilterDrawerBody.tsx.
 *
 * LocationGroup: Governorate parent checkboxes with indeterminate state
 *                + indented city children (mirrors web type B location filter).
 *
 * RangePicker + RangeSliderFilter → FilterDrawerRange.tsx
 */

import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { CheckboxIcon } from "@/components/ui/checkbox";
import type { FilterOption } from "@/components/common/FilterDrawer";

// ─── LocationGroup ────────────────────────────────────────────────────────────
//
// Mirrors web UFFilterAccordion type B:
//   • Gov parent row: bold, full-select/deselect toggle, indeterminate dash indicator
//   • City child rows: indented (ml-6/mr-6), smaller text, individual toggle

interface LocationGroupProps {
  options: FilterOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  isRtl: boolean;
}

export function LocationGroup({
  options,
  selectedValues,
  onToggle,
  isRtl,
}: LocationGroupProps) {
  // Group options by governorate
  const govMap = new Map<string, FilterOption[]>();
  for (const opt of options) {
    const g = opt.gov ?? "";
    if (!govMap.has(g)) govMap.set(g, []);
    govMap.get(g)!.push(opt);
  }
  const govEntries = Array.from(govMap.entries());

  const toggleAllCities = (cities: FilterOption[]) => {
    const allSelected = cities.every((c) => selectedValues.includes(c.value));
    for (const city of cities) {
      const citySelected = selectedValues.includes(city.value);
      // Deselect all if all selected; select missing if not all selected
      if (allSelected ? citySelected : !citySelected) {
        onToggle(city.value);
      }
    }
  };

  return (
    <View className="gap-1">
      {govEntries.map(([gov, cities]) => {
        const allSelected = cities.every((c) => selectedValues.includes(c.value));
        const someSelected = cities.some((c) => selectedValues.includes(c.value));
        const isIndeterminate = someSelected && !allSelected;

        return (
          <View key={gov}>
            {/* Governorate parent row */}
            <Pressable
              onPress={() => toggleAllCities(cities)}
              className={`flex-row items-center gap-2 py-2 ${isRtl ? "flex-row-reverse" : ""}`}
              hitSlop={4}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isIndeterminate ? "mixed" : allSelected }}
            >
              <View
                className={`w-4 h-4 rounded border-2 items-center justify-center ${
                  allSelected || isIndeterminate
                    ? "bg-primary border-primary"
                    : "border-border bg-transparent"
                }`}
              >
                {isIndeterminate ? (
                  <View className="w-2 h-0.5 bg-primary-foreground rounded-full" />
                ) : allSelected ? (
                  <CheckboxIcon />
                ) : null}
              </View>
              <Text
                className={`text-sm font-semibold text-foreground flex-1 ${
                  isRtl ? "text-right" : "text-left"
                }`}
              >
                {gov}
              </Text>
            </Pressable>

            {/* City child rows — indented by 24px (ml-6/mr-6) */}
            <View className={isRtl ? "mr-6" : "ml-6"}>
              {cities.map((city, idx) => {
                const citySelected = selectedValues.includes(city.value);
                return (
                  <View key={city.value}>
                    <Pressable
                      onPress={() => onToggle(city.value)}
                      className={`flex-row items-center gap-2 py-1.5 ${
                        isRtl ? "flex-row-reverse" : ""
                      }`}
                      hitSlop={4}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: citySelected }}
                    >
                      <View
                        className={`w-4 h-4 rounded border-2 items-center justify-center ${
                          citySelected
                            ? "bg-primary border-primary"
                            : "border-border bg-transparent"
                        }`}
                      >
                        {citySelected && <CheckboxIcon />}
                      </View>
                      <Text className="text-sm text-foreground flex-1">{city.label}</Text>
                    </Pressable>
                    {idx < cities.length - 1 && <View className="h-px bg-border" />}
                  </View>
                );
              })}
            </View>

            {/* Divider between gov groups */}
            <View className="h-px bg-border mt-1" />
          </View>
        );
      })}
    </View>
  );
}
