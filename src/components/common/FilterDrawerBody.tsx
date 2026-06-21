/**
 * FilterDrawerBody — ScrollView body of the FilterDrawer (split for line limit).
 * Internal use only; exported for FilterDrawer.tsx.
 *
 * Renders each FilterConfig entry as an AccordionSection containing either:
 *   • a RangeSliderFilter (type=range)
 *   • a list of Checkboxes   (type=multiSelect)
 *   • a RangePicker          (type=singleSelect)
 */

import React from "react";
import { ScrollView, View } from "react-native";
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import {
  AccordionSection,
  RangePicker,
  RangeSliderFilter,
} from "@/components/common/FilterDrawerSections";
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
      {filterConfig.map((fc) => {
        // Merge static options with async-fetched options
        const options = fc.options?.length
          ? fc.options
          : (optionsByKey[fc.key] ?? []);
        const isLoading = loadingOptions.has(fc.key);
        const expanded = expandedSections.has(fc.key);
        const selectedValues = (localValues[fc.key] as string[]) ?? [];

        // Range type — dual-thumb slider, no async options needed
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

        return (
          <AccordionSection
            key={fc.key}
            label={fc.label}
            expanded={expanded}
            onToggle={() => onToggleSection(fc.key)}
            isRtl={isRtl}
          >
            {isLoading ? (
              <Text className="text-sm text-muted-foreground py-2">
                {t("common.loading")}
              </Text>
            ) : fc.type === "multiSelect" ? (
              <View className="gap-2">
                {options.map((opt) => {
                  const isChecked = selectedValues.includes(opt.value);
                  return (
                    <View
                      key={opt.value}
                      className={`flex-row items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}
                    >
                      <Checkbox
                        isChecked={isChecked}
                        onChange={() => onToggleMultiValue(fc.key, opt.value)}
                        isRtl={isRtl}
                      >
                        <CheckboxIndicator isChecked={isChecked}>
                          <CheckboxIcon />
                        </CheckboxIndicator>
                        <CheckboxLabel>{opt.label}</CheckboxLabel>
                      </Checkbox>
                      {opt.count !== undefined && (
                        <Text className="text-xs text-muted-foreground">
                          ({opt.count})
                        </Text>
                      )}
                    </View>
                  );
                })}
                {options.length === 0 && !isLoading && (
                  <Text className="text-sm text-muted-foreground">
                    {t("common.empty")}
                  </Text>
                )}
              </View>
            ) : (
              // singleSelect — renders as a range picker (list of selectable options)
              <RangePicker
                options={options}
                selectedValue={selectedValues[0] ?? null}
                onSelect={(val) => onSetSingleValue(fc.key, val)}
                unit={fc.unit}
                isLoading={isLoading}
                emptyLabel={t("common.empty")}
              />
            )}
          </AccordionSection>
        );
      })}
    </ScrollView>
  );
}
