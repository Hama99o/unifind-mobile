/**
 * FilterDrawerBody — ScrollView body of the FilterDrawer (split for line limit).
 * Internal use only; exported for FilterDrawer.tsx.
 *
 * Renders each FilterConfig entry as an AccordionSection containing:
 *   • type="range"       → RangeSliderFilter (min/max inputs + slider)
 *   • type="location"    → LocationGroup (gov parent + city children, indeterminate)
 *   • type="multiSelect" → CheckboxRow list
 *   • type="singleSelect"→ RangePicker (select-one pill list)
 *
 * All sections start collapsed; the trigger itself shows an active-count badge
 * on the right when the section has selected values (so the user knows what's
 * active without expanding it).
 */

import React from "react";
import { ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import {
  AccordionSection,
  CheckboxRow,
} from "@/components/common/FilterDrawerSections";
import { LocationGroup } from "@/components/common/FilterDrawerInputs";
import {
  RangePicker,
  RangeSliderFilter,
} from "@/components/common/FilterDrawerRange";
import type {
  FilterConfig,
  FilterOption,
  FilterValues,
  RangeValue,
} from "@/components/common/FilterDrawer";

interface FilterDrawerBodyProps {
  filterConfig: FilterConfig[];
  localValues: FilterValues;
  expandedSections: Set<string>;
  optionsByKey: Record<string, FilterOption[]>;
  loadingOptions: Set<string>;
  isRtl: boolean;
  onToggleSection: (key: string) => void;
  onToggleMultiValue: (key: string, value: string) => void;
  onSetSingleValue: (key: string, value: string | null) => void;
  onSetRangeValue: (key: string, range: RangeValue) => void;
}

export function FilterDrawerBody({
  filterConfig,
  localValues,
  expandedSections,
  optionsByKey,
  loadingOptions,
  isRtl,
  onToggleSection,
  onToggleMultiValue,
  onSetSingleValue,
  onSetRangeValue,
}: FilterDrawerBodyProps) {
  const { t } = useCustomTranslation();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="flex-1"
      keyboardShouldPersistTaps="handled"
    >
      {/* Outer wrapper with rounded corners on first/last items */}
      <View className="mx-4 my-3 rounded-xl overflow-hidden">
        {filterConfig.map((fc, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === filterConfig.length - 1;

          // Merge static options with async-fetched options
          const options: FilterOption[] = fc.options?.length
            ? fc.options
            : (optionsByKey[fc.key] ?? []);
          const isLoading = loadingOptions.has(fc.key);
          const expanded = expandedSections.has(fc.key);
          const selectedValues = (localValues[fc.key] as string[]) ?? [];

          // Active-selection count for the header badge: array length for
          // multi-select/location, 1 for a set range/single value, else 0.
          const fv = localValues[fc.key];
          const activeCount =
            fc.type === "range"
              ? fv != null
                ? 1
                : 0
              : Array.isArray(fv)
                ? fv.length
                : fv != null && fv !== false
                  ? 1
                  : 0;

          // ── Range ──────────────────────────────────────────────────────────
          if (fc.type === "range") {
            const rangeVal = localValues[fc.key] as RangeValue | undefined;
            const rangeMin = fc.min ?? 0;
            const rangeMax = fc.max ?? 100;
            const rangeStep = fc.step ?? 1;
            const currentRange: RangeValue = rangeVal ?? [rangeMin, rangeMax];
            return (
              <AccordionSection
                key={fc.key}
                label={fc.label}
                expanded={expanded}
                onToggle={() => onToggleSection(fc.key)}
                isRtl={isRtl}
                isFirst={isFirst}
                isLast={isLast}
                activeCount={activeCount}
              >
                <RangeSliderFilter
                  minBound={rangeMin}
                  maxBound={rangeMax}
                  step={rangeStep}
                  unit={fc.unit}
                  value={currentRange}
                  onChange={(range) => onSetRangeValue(fc.key, range)}
                  isRtl={isRtl}
                />
              </AccordionSection>
            );
          }

          // ── Location (grouped by governorate) ──────────────────────────────
          if (fc.type === "location") {
            return (
              <AccordionSection
                key={fc.key}
                label={fc.label}
                expanded={expanded}
                onToggle={() => onToggleSection(fc.key)}
                isRtl={isRtl}
                isFirst={isFirst}
                isLast={isLast}
                activeCount={activeCount}
              >
                {isLoading ? (
                  <Text className="text-sm text-muted-foreground py-2">
                    {t("common.loading")}
                  </Text>
                ) : options.length === 0 ? (
                  <Text className="text-sm text-muted-foreground py-2">
                    {t("common.empty")}
                  </Text>
                ) : (
                  <LocationGroup
                    options={options}
                    selectedValues={selectedValues}
                    onToggle={(val) => onToggleMultiValue(fc.key, val)}
                    isRtl={isRtl}
                  />
                )}
              </AccordionSection>
            );
          }

          // ── MultiSelect (checkbox list) ────────────────────────────────────
          if (fc.type === "multiSelect") {
            return (
              <AccordionSection
                key={fc.key}
                label={fc.label}
                expanded={expanded}
                onToggle={() => onToggleSection(fc.key)}
                isRtl={isRtl}
                isFirst={isFirst}
                isLast={isLast}
                activeCount={activeCount}
              >
                {isLoading ? (
                  <Text className="text-sm text-muted-foreground py-2">
                    {t("common.loading")}
                  </Text>
                ) : options.length === 0 ? (
                  <Text className="text-sm text-muted-foreground py-2">
                    {t("common.empty")}
                  </Text>
                ) : (
                  <View>
                    {options.map((opt, optIdx) => (
                      <CheckboxRow
                        key={opt.value}
                        label={opt.label}
                        isChecked={selectedValues.includes(opt.value)}
                        onToggle={() => onToggleMultiValue(fc.key, opt.value)}
                        count={opt.count}
                        isRtl={isRtl}
                        isLast={optIdx === options.length - 1}
                      />
                    ))}
                  </View>
                )}
              </AccordionSection>
            );
          }

          // ── SingleSelect (range picker — select one option) ─────────────────
          return (
            <AccordionSection
              key={fc.key}
              label={fc.label}
              expanded={expanded}
              onToggle={() => onToggleSection(fc.key)}
              isRtl={isRtl}
              isFirst={isFirst}
              isLast={isLast}
              activeCount={activeCount}
            >
              <RangePicker
                options={options}
                selectedValue={selectedValues[0] ?? null}
                onSelect={(val) => onSetSingleValue(fc.key, val)}
                unit={fc.unit}
                isLoading={isLoading}
                emptyLabel={t("common.empty")}
              />
            </AccordionSection>
          );
        })}
      </View>
    </ScrollView>
  );
}
