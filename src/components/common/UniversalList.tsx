/**
 * UniversalList<T> — the ONLY list component for feature list screens.
 * Replaces web UFLayoutWithSidebar + UFCard* + UFSort + UFPagination.
 *
 * Owns: debounced search · sort picker · filter drawer trigger ·
 *       infinite scroll (on-end-reached) · pull-to-refresh ·
 *       skeleton / empty / error states · FilterTags chip row.
 *
 * Screens are thin: build a config, pass it in.
 * UNIVERSAL_LIST.md is the authoritative spec.
 *
 * Sub-components: ListSkeleton · ListSearchBar · ListSortSheet (split for line cap).
 *
 * Design: cohesive top area — SubNavBar (if provided) → search+action row →
 * results count (right-aligned, muted) → active filter chips.
 * Cards separated by 12px gap. Comfortable horizontal padding (16px).
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  FlatList,
  RefreshControl,
  View,
  ActivityIndicator,
} from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterDrawer } from "@/components/common/FilterDrawer";
import { FilterTags } from "@/components/common/FilterTags";
import { ListSkeleton } from "@/components/common/ListSkeleton";
import { ListSearchBar } from "@/components/common/ListSearchBar";
import { ListSortSheet } from "@/components/common/ListSortSheet";
import { useColors } from "@/hooks/useColors";
import { useLocalization } from "@/hooks/useLocalization";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import type { FilterConfig, FilterValues, FilterOption } from "@/components/common/FilterDrawer";

export type { SortOption } from "@/components/common/UniversalListTypes";
export type { UniversalListConfig } from "@/components/common/UniversalListTypes";

import type { SortOption, UniversalListConfig } from "@/components/common/UniversalListTypes";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props<T> {
  config: UniversalListConfig<T>;
  /** Optional sticky bottom bar (e.g. CompareBar) */
  stickyBottom?: React.ReactNode;
  /** Pre-applied filter values from navigation params */
  initialFilters?: FilterValues;
  /** Pre-applied sort key */
  initialSort?: string;
}

const DEBOUNCE_MS = 350;

// ─── UniversalList ────────────────────────────────────────────────────────────

export function UniversalList<T>({
  config,
  stickyBottom,
  initialFilters,
  initialSort,
}: Props<T>) {
  const { t, isRtl } = useCustomTranslation();
  const { formatNumber } = useLocalization();
  const colors = useColors();

  // ── State ──────────────────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState(initialSort ?? config.sort?.default ?? "default");
  const [filterValues, setFilterValues] = useState<FilterValues>(initialFilters ?? {});
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  /** Async-resolved filter options — lifted from FilterDrawer for label resolution in FilterTags */
  const [resolvedOptions, setResolvedOptions] = useState<Record<string, FilterOption[]>>({});

  const activeFilterCount = Object.values(filterValues).filter(
    (v) => (Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== false)
  ).length;

  // ── Debounce search ────────────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // ── Sync initial filters (deep-link params) ────────────────────────────────
  useEffect(() => {
    if (initialFilters) {
      setFilterValues(initialFilters);
    }
  }, [JSON.stringify(initialFilters)]);

  // ── Fetch (React Query) ────────────────────────────────────────────────────
  // Cached per list + search + filters + sort: coming back to a list renders the
  // pages already loaded instead of a skeleton (QA 2026-11-10 RQ-01).
  const listQuery = useInfiniteQuery({
    queryKey: [...config.queryKey, debouncedSearch, filterValues, sort],
    queryFn: ({ pageParam }) =>
      config.fetchPage({ page: pageParam, search: debouncedSearch, filters: filterValues, sort }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pageCount ? last.page + 1 : undefined),
  });

  const pages = listQuery.data?.pages ?? [];
  const merged = pages.flatMap((p) => p.items);
  const items =
    config.clientComparator && merged.length > 0
      ? [...merged].sort((a, b) => config.clientComparator!(a, b, sort))
      : merged;
  const total = pages.length ? pages[pages.length - 1].total : 0;
  const loading = listQuery.isPending;
  const loadingMore = listQuery.isFetchingNextPage;
  const error = listQuery.isError && !listQuery.data ? t("common.loadError") : null;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) void listQuery.fetchNextPage();
  }, [listQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await listQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [listQuery]);

  const handleRetry = useCallback(() => {
    void listQuery.refetch();
  }, [listQuery]);

  const handleApplyFilters = useCallback((values: FilterValues) => {
    setFilterValues(values);
    setShowFilterDrawer(false);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilterValues({});
    setShowFilterDrawer(false);
  }, []);

  const handleRemoveFilter = useCallback((key: string, value?: string) => {
    setFilterValues((prev) => {
      const next = { ...prev };
      if (value !== undefined && Array.isArray(next[key])) {
        const arr = (next[key] as string[]).filter((v) => v !== value);
        if (arr.length === 0) delete next[key];
        else next[key] = arr;
      } else {
        delete next[key];
      }
      return next;
    });
  }, []);

  const handleSelectSort = useCallback((key: string) => {
    setSort(key);
    setShowSortSheet(false);
  }, []);

  // ── Sort options ───────────────────────────────────────────────────────────
  const sortOptions: SortOption[] = config.sort?.options ?? [];

  // ── List header ────────────────────────────────────────────────────────────
  // SubNavBar sits above the search row — rendered as the first item in the header
  // so it scrolls with the list (avoids double sticky bars).
  const renderHeader = () => (
    <View>
      {/* SubNavBar (tab switcher) — scrolls with list, sits in the cohesive top area */}
      {config.subNav && <View>{config.subNav}</View>}

      {/* Search + filter + sort row */}
      <ListSearchBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={config.searchPlaceholder}
        searchable={config.searchable}
        hasFilters={Boolean(config.filters && config.filters.length > 0)}
        activeFilterCount={activeFilterCount}
        hasSortOptions={sortOptions.length > 0}
        onOpenFilter={() => setShowFilterDrawer(true)}
        onOpenSort={() => setShowSortSheet(true)}
      />

      {/* Results count — right-aligned, prussian, font-semibold (matches web mobile) */}
      <View className={`px-4 pt-1 pb-2 flex-row ${isRtl ? "justify-start" : "justify-end"}`}>
        {config.showResultsCount !== false && !loading && !error && (
          <Text className="text-sm font-semibold text-foreground">
            {formatNumber(total)} {t("results")}
          </Text>
        )}
      </View>

      {config.filters && (
        <FilterTags
          filterValues={filterValues}
          filterConfig={config.filters}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
          optionsByKey={resolvedOptions}
        />
      )}

      {/* Gap before first card */}
      <View style={{ height: 8 }} />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-6 items-center">
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  };

  // Loading / error / empty all render INSIDE the one FlatList, so the header
  // (and the focused search input) is never unmounted while typing.
  const renderEmpty = () => {
    if (loading) return <ListSkeleton variant={config.skeletonVariant} />;
    if (error) {
      return (
        <EmptyState
          title={error}
          description={t("common.loadErrorDesc")}
          action={
            <View className="w-full">
              <Button label={t("common.retry")} onPress={handleRetry} />
            </View>
          }
        />
      );
    }
    return (
      <EmptyState
        title={config.empty?.title ?? t("common.empty")}
        description={config.empty?.description}
      />
    );
  };

  return (
    <View className="flex-1">
      <FlatList
        data={loading || error ? [] : items}
        keyExtractor={(item, i) => {
          try {
            return config.keyExtractor(item);
          } catch {
            return String(i);
          }
        }}
        renderItem={({ item, index }) =>
          (config.renderItem(item, index) as React.ReactElement) ?? null
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: stickyBottom ? 88 : 24,
        }}
        // An element (not a function): a new function each render would be a new
        // component type and remount the search input on every keystroke.
        ListHeaderComponent={renderHeader()}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {/* Filter drawer */}
      {config.filters && (
        <FilterDrawer
          isOpen={showFilterDrawer}
          onClose={() => setShowFilterDrawer(false)}
          filterConfig={config.filters}
          values={filterValues}
          onApply={handleApplyFilters}
          onClearAll={handleClearAllFilters}
          onOptionsLoaded={setResolvedOptions}
          resultsCount={total}
        />
      )}

      {/* Sort sheet */}
      <ListSortSheet
        isOpen={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        sortOptions={sortOptions}
        currentSort={sort}
        onSelect={handleSelectSort}
      />

      {/* Sticky bottom slot */}
      {stickyBottom && (
        <View className="absolute bottom-0 left-0 right-0">{stickyBottom}</View>
      )}
    </View>
  );
}
