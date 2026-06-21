/**
 * offeringFilters — filter config for Find Offerings screen.
 * Passed to UniversalList config.filters.
 *
 * 3 filters (web parity + price improvement over web stub):
 *   1. category    (multiSelect, accordion) — from /api/offerings/category-usage
 *      → Maps to Node `categoryId` params.
 *   2. fieldOfStudy (multiSelect, accordion) — from /api/offerings/field-usage
 *      → Selected fields → INTERSECTION of their offering-id arrays → Node `offeringContentId` params.
 *   3. price       (range) — 0–500, step 10, "$"
 *      → Maps to Node `price=min-max`.
 *      NOTE: Web has an empty stub for this filter; we implement it as a working range.
 */

import { offeringsFilterApi } from "@/api/offeringsFilterApi";
import type { FilterConfig, FilterOption } from "@/components/common/FilterDrawer";

export function buildOfferingFilterConfig(
  t: (key: string) => string,
  locale: "en" | "ar"
): FilterConfig[] {
  return [
    {
      key: "category",
      label: t("category"),
      type: "multiSelect",
      presentation: "accordion",
      fetchOptions: async (): Promise<FilterOption[]> => {
        const raw = await offeringsFilterApi.fetchCategories(locale);
        return raw.map((item) => ({
          label: item.category.name,
          value: String(item.category.id),
          count: item.offerings.length,
        }));
      },
    },
    {
      key: "fieldOfStudy",
      label: t("fields"),
      type: "multiSelect",
      presentation: "accordion",
      fetchOptions: async (): Promise<FilterOption[]> => {
        const raw = await offeringsFilterApi.fetchFields(locale);
        return raw.map((item) => ({
          label: item.field.name,
          // value encodes the array of offering ids (JSON-encoded for intersection logic)
          value: JSON.stringify(item.offerings),
          count: item.offerings.length,
        }));
      },
    },
    {
      key: "price",
      label: t("price"),
      type: "range",
      min: 0,
      max: 500,
      step: 10,
      unit: "$",
    },
  ];
}

/** Sentinel value meaning the field filter was engaged but the intersection is empty.
 * Callers must distinguish this from "no field filter" to return zero results. */
export const EMPTY_FIELD_INTERSECTION = "__EMPTY_FIELD_INTERSECTION__";

/**
 * Build Node query params from FilterValues.
 *
 * category filter → categoryIds string[]
 * fieldOfStudy filter → offeringContentIds via INTERSECTION of selected field offering-id arrays
 *   - If field filter is active and intersection is empty, returns [EMPTY_FIELD_INTERSECTION]
 *     so the caller can short-circuit to zero results.
 * price filter → priceRange "min-max" (ONLY sent when actually narrowed from the full [0,500] bounds)
 */
export function buildOfferingNodeParams(filterValues: Record<string, unknown>): {
  categoryIds: string[];
  offeringContentIds: string[];
  priceRange: string;
  fieldFilterEngaged: boolean;
  fieldIntersectionEmpty: boolean;
} {
  // Category IDs (multiSelect: array of string category ids)
  const categoryIds = ((filterValues.category as string[]) ?? []).filter(Boolean);

  // Field intersection: each selected field value is JSON-encoded offering ids array.
  // INTERSECTION of all selected field offering-id arrays (exact web parity).
  const selectedFieldValues = (filterValues.fieldOfStudy as string[]) ?? [];
  let commonOfferingIds: number[] = [];
  const fieldFilterEngaged = selectedFieldValues.length > 0;
  let fieldIntersectionEmpty = false;

  if (fieldFilterEngaged) {
    const arrays = selectedFieldValues.map((v) => {
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? (parsed as number[]) : [];
      } catch {
        return [];
      }
    });

    commonOfferingIds = arrays.reduce<number[]>((acc, curr, idx) => {
      if (idx === 0) return curr;
      return acc.filter((id) => curr.includes(id));
    }, []);

    if (commonOfferingIds.length === 0) {
      fieldIntersectionEmpty = true;
    }
  }

  // Price range — only send when actually narrowed from the full bounds [0, 500].
  // This avoids dropping offerings with null price when the slider hasn't been moved.
  const PRICE_MIN = 0;
  const PRICE_MAX = 500;
  const priceRaw = filterValues.price as [number, number] | undefined;
  let priceRange = "";
  if (priceRaw && Array.isArray(priceRaw) && priceRaw.length === 2) {
    const [lo, hi] = priceRaw;
    if (lo > PRICE_MIN || hi < PRICE_MAX) {
      priceRange = `${lo}-${hi}`;
    }
  }

  return {
    categoryIds,
    offeringContentIds: commonOfferingIds.map(String),
    priceRange,
    fieldFilterEngaged,
    fieldIntersectionEmpty,
  };
}
