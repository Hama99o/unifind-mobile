/**
 * useInstitutionsData — data hook for the Find Institutions screen.
 *
 * H1 refactor: toggle/seed logic moved to useSelection. This hook now only
 * owns buildFilterParams (its actual unique logic). isFavorite/isCompared/
 * toggleFavorite/toggleCompare/seedSelection come from useSelection directly.
 *
 * Separation of concerns: data logic here, UI in FindInstitutionsScreen.tsx.
 */

import { useCallback } from "react";
import type { FilterValues } from "@/components/common/FilterDrawer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocationRawItem {
  label: string;
  gov: string;
  value: string; // "gov,city"
  institutionId: string;
}

export interface FilterApiParams {
  idIn?: string[];
  tuitionMin?: number | null;
  tuitionMax?: number | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInstitutionsData() {
  // ── Build filter API params from UI filter values ───────────────────────────
  const buildFilterParams = useCallback(
    (filterValues: FilterValues, locationRawMap: LocationRawItem[]): FilterApiParams => {
      // Degree filter — values are comma-separated institution id strings
      const selectedDegreeIds = ((filterValues.degreeLevel as string[]) ?? [])
        .flatMap((v) => v.split(",").map((s) => s.trim()).filter(Boolean));

      // Field of study filter — same shape
      const selectedFieldIds = ((filterValues.fieldOfStudy as string[]) ?? [])
        .flatMap((v) => v.split(",").map((s) => s.trim()).filter(Boolean));

      // Location filter — values are "gov,city" strings → look up institution ids
      const selectedLocationValues = (filterValues.location as string[]) ?? [];
      const selectedLocationIds = locationRawMap
        .filter((loc) => selectedLocationValues.includes(loc.value))
        .map((loc) => loc.institutionId)
        .filter(Boolean);

      // Merge degree∩field then ∪ location (exact web logic)
      let mergedIds: string[] = [];
      const hasDegrees = selectedDegreeIds.length > 0;
      const hasFields = selectedFieldIds.length > 0;

      if (hasDegrees && hasFields) {
        mergedIds = selectedDegreeIds.filter((id) => selectedFieldIds.includes(id));
      } else if (hasDegrees) {
        mergedIds = selectedDegreeIds;
      } else if (hasFields) {
        mergedIds = selectedFieldIds;
      }

      mergedIds = Array.from(new Set([...mergedIds, ...selectedLocationIds]));

      // Tuition filter — singleSelect: value is "min - max" string
      const tuitionValues = filterValues.tuition as string[] | undefined;
      let tuitionMin: number | null = null;
      let tuitionMax: number | null = null;
      if (tuitionValues && tuitionValues.length > 0) {
        const last = tuitionValues[tuitionValues.length - 1];
        const parts = last.split(" - ");
        tuitionMin = parseFloat(parts[0] ?? "0");
        tuitionMax = parseFloat(parts[1] ?? "1000000");
      }

      return {
        idIn: mergedIds.length > 0 ? mergedIds : undefined,
        tuitionMin,
        tuitionMax,
      };
    },
    []
  );

  return { buildFilterParams };
}
