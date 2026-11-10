/**
 * FilterDrawer — Gluestack Actionsheet-based filter panel.
 * Redesigned to match the web UFFilterAccordion / UFBottomSheet visual spec:
 *
 *   • Accordion sections: white bg closed → prussian bg open (text inverts)
 *   • Location sections: grouped by governorate with indeterminate parent checkbox
 *   • Range sections: two-thumb slider with min/max number inputs below
 *   • Header: filter icon + "Filter & Sort" title + X close button
 *   • Footer: single full-width prussian "Show N Results" button
 *
 * Filter VALUES contract is unchanged — FilterDrawer still calls onApply(values)
 * and onClearAll() so UniversalList.tsx needs no edits.
 *
 * Sub-components: FilterDrawerBody.tsx · FilterDrawerSections.tsx
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Pressable } from "react-native";
import { X, SlidersHorizontal } from "lucide-react-native";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
} from "@/components/ui/actionsheet";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { useLocalization } from "@/hooks/useLocalization";
import { FilterDrawerBody } from "@/components/common/FilterDrawerBody";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FilterType = "multiSelect" | "singleSelect" | "range" | "location";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  /** Governorate parent — used by type="location" grouped sections */
  gov?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  fetchOptions?: () => Promise<FilterOption[]>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  presentation?: "accordion" | "dropdown";
}

/** Range filter values are [min, max] as numbers stored as a tuple */
export type RangeValue = [number, number];

export type FilterValues = Record<
  string,
  string[] | [string, string] | RangeValue | boolean
>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filterConfig: FilterConfig[];
  values: FilterValues;
  onApply: (values: FilterValues) => void;
  onClearAll: () => void;
  /** Lifted resolved async options so FilterTags can show human-readable labels */
  onOptionsLoaded?: (optionsByKey: Record<string, FilterOption[]>) => void;
  /** Live results count shown in the footer button — matches web "Show N Results" */
  resultsCount?: number;
}

// ─── FilterDrawer ─────────────────────────────────────────────────────────────

export function FilterDrawer({
  isOpen,
  onClose,
  filterConfig,
  values,
  onApply,
  onClearAll,
  onOptionsLoaded,
  resultsCount,
}: Props) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const { formatNumber } = useLocalization();

  // Local working copy — committed on "Show Results"
  const [localValues, setLocalValues] = useState<FilterValues>(values);
  // All sections start collapsed (matches web default expandedSections=[])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [optionsByKey, setOptionsByKey] = useState<Record<string, FilterOption[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Set<string>>(new Set());

  const fetchedKeys = useRef<Set<string>>(new Set());
  const prevFilterConfigRef = useRef<FilterConfig[]>(filterConfig);

  // Reset cache when filterConfig changes (locale switch rebuilds closures)
  useEffect(() => {
    if (prevFilterConfigRef.current !== filterConfig) {
      prevFilterConfigRef.current = filterConfig;
      fetchedKeys.current = new Set();
      setOptionsByKey({});
    }
  }, [filterConfig]);

  // Sync local values when drawer opens
  useEffect(() => {
    if (isOpen) setLocalValues(values);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, JSON.stringify(values)]);

  // Fetch dynamic options when drawer opens (once per key per filterConfig identity)
  const fetchOptions = useCallback(() => {
    if (!isOpen) return;
    for (const fc of filterConfig) {
      if (fc.fetchOptions && !fetchedKeys.current.has(fc.key)) {
        fetchedKeys.current.add(fc.key);
        setLoadingOptions((prev) => new Set(prev).add(fc.key));
        fc.fetchOptions()
          .then((opts) => {
            // Do NOT call onOptionsLoaded inside the updater — React runs
            // updaters during render, and onOptionsLoaded is the parent's
            // setState (setResolvedOptions), which would update the parent
            // mid-render ("Cannot update a component while rendering a
            // different component"). The effect below notifies the parent
            // after optionsByKey commits.
            setOptionsByKey((prev) => ({ ...prev, [fc.key]: opts }));
          })
          .finally(() =>
            setLoadingOptions((prev) => {
              const next = new Set(prev);
              next.delete(fc.key);
              return next;
            })
          );
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filterConfig]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Notify the parent of resolved filter options AFTER they commit — in an
  // effect, never inside a render/updater (which would update the parent
  // mid-render). onOptionsLoaded is a stable setState from the parent.
  useEffect(() => {
    onOptionsLoaded?.(optionsByKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsByKey]);

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleMultiValue = (key: string, value: string) =>
    setLocalValues((prev) => {
      const current = (prev[key] as string[]) ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (next.length === 0) {
        const rest = { ...prev };
        delete rest[key];
        return rest;
      }
      return { ...prev, [key]: next };
    });

  const setSingleValue = (key: string, value: string | null) =>
    setLocalValues((prev) => {
      if (value === null) {
        const rest = { ...prev };
        delete rest[key];
        return rest;
      }
      return { ...prev, [key]: [value] };
    });

  const setRangeValue = (key: string, range: RangeValue) =>
    setLocalValues((prev) => ({ ...prev, [key]: range }));

  const handleApply = () => {
    onApply(localValues);
    onClose();
  };

  const handleClearAll = () => {
    setLocalValues({});
    onClearAll();
  };

  // Web: t('showResults', { val }) → "Show 1,234 Results". Number goes through
  // useLocalization (Arabic digits in ar), never raw toLocaleString.
  const footerLabel =
    resultsCount !== undefined
      ? t("showResults", { val: formatNumber(resultsCount) })
      : t("showResultsPlain");

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop onPress={onClose} />
      <ActionsheetContent className="max-h-[85%] bg-background">
        {/* Drag handle */}
        <ActionsheetDragIndicator />

        {/* Header — filter icon + title + X close (web UFBottomSheet header) */}
        <View
          className={`flex-row items-center justify-between px-4 pb-4 border-b border-border ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <View className={`flex-row items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <SlidersHorizontal size={18} color={colors.primary} />
            <Text className="text-lg font-bold text-foreground">
              {t("btnFilterAndSort")}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="p-2 rounded-full active:bg-muted"
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          >
            <X size={20} color={colors.primary} />
          </Pressable>
        </View>

        {/* Scrollable body — accordion sections */}
        <FilterDrawerBody
          filterConfig={filterConfig}
          localValues={localValues}
          expandedSections={expandedSections}
          optionsByKey={optionsByKey}
          loadingOptions={loadingOptions}
          isRtl={isRtl}
          onToggleSection={toggleSection}
          onToggleMultiValue={toggleMultiValue}
          onSetSingleValue={setSingleValue}
          onSetRangeValue={setRangeValue}
        />

        {/* Footer — single full-width prussian "Show N Results" button (web spec) */}
        <View className="px-4 pt-3 pb-4 border-t border-border bg-background">
          <Button
            label={footerLabel}
            onPress={handleApply}
            action="primary"
            testID="filter-drawer-apply"
          />
        </View>
      </ActionsheetContent>
    </Actionsheet>
  );
}
