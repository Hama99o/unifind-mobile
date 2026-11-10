/**
 * UniversalListTypes — shared type definitions for UniversalList and its sub-components.
 * Extracted to avoid circular imports.
 */

import type { FilterConfig, FilterValues } from "@/components/common/FilterDrawer";
import type { ListSkeletonVariant } from "@/components/common/ListSkeleton";

export interface SortOption {
  key: string;
  label: string;
}

export interface UniversalListConfig<T> {
  // Data
  /**
   * React Query key for this list (include everything fetchPage closes over,
   * e.g. locale). Search, filters and sort are appended automatically.
   */
  queryKey: readonly unknown[];
  fetchPage: (params: {
    page: number;
    search: string;
    filters: FilterValues;
    sort: string;
  }) => Promise<import("@/types/page").Page<T>>;

  /**
   * Optional client-side comparator that re-sorts the ENTIRE accumulated list
   * after each page append. Required when server-side sorting is not available
   * (e.g. offerings price sort which is done client-side per-page).
   * Signature mirrors Array.prototype.sort's compareFn.
   */
  clientComparator?: (a: T, b: T, sort: string) => number;

  // Header
  title?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  /** "N Results" total label */
  showResultsCount?: boolean;

  // Sort
  sort?: {
    options: SortOption[];
    default: string;
  };

  // Filters
  filters?: FilterConfig[];

  // Optional sub-nav slot (rendered above search)
  subNav?: React.ReactNode;

  // Rendering
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;

  // Empty state
  empty?: { title: string; description?: string };

  /**
   * Shape the loading skeleton bones to match the card type.
   * Passed through to <ListSkeleton variant={skeletonVariant} />.
   * Omit for the generic tall-block skeleton.
   */
  skeletonVariant?: ListSkeletonVariant;
}
