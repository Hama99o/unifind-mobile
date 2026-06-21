/**
 * FilterDrawer — Gluestack Actionsheet-based filter panel.
 * Replaces web UFFilterAccordion / UFFilterDropDown.
 * FILTER_DRAWER.md is the authoritative spec.
 *
 * Supports: multiSelect (checkbox + accordion) · singleSelect (range picker)
 *           · range (dual-thumb slider, min/max/step configurable).
 * Sub-components: see FilterDrawerSections.tsx (split for line limit).
 * Footer: Apply + Clear All.
 *
 * onOptionsLoaded callback lifts resolved async options so FilterTags can show
 * human-readable labels (not raw IDs).
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Pressable } from "react-native";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
} from "@/components/ui/actionsheet";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { FilterDrawerBody } from "@/components/common/FilterDrawerBody";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FilterType = "multiSelect" | "singleSelect" | "range";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
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
  /** Called whenever async options finish loading, so FilterTags can resolve labels */
  onOptionsLoaded?: (optionsByKey: Record<string, FilterOption[]>) => void;
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
}: Props) {
  const { t, isRtl } = useCustomTranslation();

  // Local working copy — only committed on Apply
  const [localValues, setLocalValues] = useState<FilterValues>(values);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(filterConfig.map((f) => f.key))
  );
  const [optionsByKey, setOptionsByKey] = useState<Record<string, FilterOption[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Set<string>>(new Set());

  // Track which keys have already been fetched (avoid re-fetch on re-open).
  // Reset whenever filterConfig identity changes (locale switch rebuilds config).
  const fetchedKeys = useRef<Set<string>>(new Set());
  const prevFilterConfigRef = useRef<FilterConfig[]>(filterConfig);

  // Reset fetched-keys cache and cleared options when filterConfig changes
  // (e.g. locale switch: config is rebuilt with new fetchOptions closures).
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
  }, [isOpen, JSON.stringify(values)]);

  // Fetch dynamic options when drawer opens (once per key per filterConfig identity).
  // Deps include filterConfig so a locale-triggered config rebuild forces a re-fetch.
  const fetchOptions = useCallback(() => {
    if (!isOpen) return;
    for (const fc of filterConfig) {
      if (fc.fetchOptions && !fetchedKeys.current.has(fc.key)) {
        fetchedKeys.current.add(fc.key);
        setLoadingOptions((prev) => new Set(prev).add(fc.key));
        fc.fetchOptions()
          .then((opts) => {
            setOptionsByKey((prev) => {
              const next = { ...prev, [fc.key]: opts };
              onOptionsLoaded?.(next);
              return next;
            });
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

  const handleApply = () => onApply(localValues);

  const handleClearAll = () => {
    setLocalValues({});
    onClearAll();
  };

  const activeCount = Object.values(localValues).filter(
    (v) =>
      Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== false
  ).length;

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop onPress={onClose} />
      <ActionsheetContent className="max-h-[85%]">
        <ActionsheetDragIndicator />

        {/* Header */}
        <View
          className={`flex-row items-center justify-between px-4 pb-3 border-b border-border ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <Heading size="md" className="text-foreground">
            {t("filterBy")}
          </Heading>
          {activeCount > 0 && (
            <Pressable onPress={handleClearAll} hitSlop={8}>
              <Text className="text-sm text-primary font-semibold">
                {t("clearSelection")} ({activeCount})
              </Text>
            </Pressable>
          )}
        </View>

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

        {/* Footer */}
        <View className={`flex-row gap-3 px-4 pt-3 pb-2 ${isRtl ? "flex-row-reverse" : ""}`}>
          <View className="flex-1">
            <Button
              label={t("clearSelection")}
              variant="outline"
              action="primary"
              onPress={handleClearAll}
            />
          </View>
          <View className="flex-1">
            <Button
              label={`${t("showResults")} (${activeCount})`}
              action="primary"
              onPress={handleApply}
            />
          </View>
        </View>
      </ActionsheetContent>
    </Actionsheet>
  );
}
