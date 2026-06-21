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
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import type { Page } from "@/types/page";
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
  const colors = useColors();

  // ── State ──────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setPage(1);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // ── Sync initial filters (deep-link params) ────────────────────────────────
  useEffect(() => {
    if (initialFilters) {
      setFilterValues(initialFilters);
      setPage(1);
    }
  }, [JSON.stringify(initialFilters)]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (pageNum: number, append: boolean) => {
      try {
        if (pageNum === 1 && !append) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        const result = await config.fetchPage({
          page: pageNum,
          search: debouncedSearch,
          filters: filterValues,
          sort,
        });

        setItems((prev) => {
          const merged = append ? [...prev, ...result.items] : result.items;
          // Re-sort the entire accumulated list if a client comparator is provided.
          // This ensures globally-ordered sort across infinite-scroll pages.
          if (config.clientComparator && merged.length > 0) {
            return [...merged].sort((a, b) => config.clientComparator!(a, b, sort));
          }
          return merged;
        });
        setPage(result.page);
        setPageCount(result.pageCount);
        setTotal(result.total);
      } catch {
        setError(t("common.retry"));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [config.fetchPage, debouncedSearch, filterValues, sort, t]
  );

  // Reload from page 1 whenever search/filters/sort change
  useEffect(() => {
    setItems([]);
    setPage(1);
    fetchData(1, false);
  }, [debouncedSearch, filterValues, sort]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (loadingMore || loading || page >= pageCount) return;
    const next = page + 1;
    setPage(next);
    fetchData(next, true);
  }, [loadingMore, loading, page, pageCount, fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchData(1, false);
  }, [fetchData]);

  const handleRetry = useCallback(() => {
    setPage(1);
    fetchData(1, false);
  }, [fetchData]);

  const handleApplyFilters = useCallback((values: FilterValues) => {
    setFilterValues(values);
    setPage(1);
    setShowFilterDrawer(false);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilterValues({});
    setPage(1);
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
    setPage(1);
  }, []);

  const handleSelectSort = useCallback((key: string) => {
    setSort(key);
    setShowSortSheet(false);
    setPage(1);
  }, []);

  // ── Sort options ───────────────────────────────────────────────────────────
  const sortOptions: SortOption[] = config.sort?.options ?? [];

  // ── List header ────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View className="gap-2 pb-2">
      {config.subNav && <View>{config.subNav}</View>}

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

      {config.showResultsCount !== false && !loading && (
        <View className={`px-4 ${isRtl ? "items-end" : ""}`}>
          <Text className="text-sm text-muted-foreground">
            {total} {t("results")}
          </Text>
        </View>
      )}

      {config.filters && (
        <FilterTags
          filterValues={filterValues}
          filterConfig={config.filters}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
          optionsByKey={resolvedOptions}
        />
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1">
        {renderHeader()}
        <ListSkeleton variant={config.skeletonVariant} />
        <ListSortSheet
          isOpen={showSortSheet}
          onClose={() => setShowSortSheet(false)}
          sortOptions={sortOptions}
          currentSort={sort}
          onSelect={handleSelectSort}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1">
        {renderHeader()}
        <EmptyState title={error} description={t("common.retry")} />
        <Button label={t("common.retry")} onPress={handleRetry} className="mx-4 mt-2" />
        <ListSortSheet
          isOpen={showSortSheet}
          onClose={() => setShowSortSheet(false)}
          sortOptions={sortOptions}
          currentSort={sort}
          onSelect={handleSelectSort}
        />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={items}
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
          paddingBottom: stickyBottom ? 80 : 16,
        }}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <EmptyState
            title={config.empty?.title ?? t("common.empty")}
            description={config.empty?.description}
          />
        }
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
        ItemSeparatorComponent={() => <View className="h-4" />}
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
