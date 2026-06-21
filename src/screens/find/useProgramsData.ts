/**
 * useProgramsData — data hook for the Find Programs screen.
 *
 * H1 refactor: toggle/seed logic moved to useSelection. This hook now only
 * owns buildFilterParams (its actual unique logic). isFavorite/isCompared/
 * toggleFavorite/toggleCompare/seedSelection come from useSelection directly.
 *
 * Separation of concerns: data logic here, UI in FindProgramsScreen.tsx.
 */

import { useCallback } from "react";
import type { FilterValues, RangeValue } from "@/components/common/FilterDrawer";
import type { ProgramLocationRaw } from "@/api/programsFilterApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgramFilterApiParams {
  degreeIds?: string[];
  fieldOfStudyIds?: string[];
  locationIds?: string[];
  nbOfYearsMins?: number[];
  nbOfYearsMaxs?: number[];
  languageIds?: string[];
  /** undefined means no tuition constraint (slider at full range [0,3000]) */
  tuitionMin?: number;
  /** undefined means no tuition constraint (slider at full range [0,3000]) */
  tuitionMax?: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProgramsData() {
  // ── Build filter API params ─────────────────────────────────────────────────
  const buildFilterParams = useCallback(
    (
      filterValues: FilterValues,
      locationRawMap: ProgramLocationRaw[]
    ): ProgramFilterApiParams => {
      // Degree filter — values are Strapi degree ids (strings)
      const degreeIds = (filterValues.degree as string[] | undefined) ?? [];

      // Field of study filter — values are Strapi study field ids
      const fieldOfStudyIds =
        (filterValues.fieldOfStudy as string[] | undefined) ?? [];

      // Location filter — values are "gov,city" strings → resolve to ALL location ids
      // for that city (a city may have multiple campuses, each with its own location id).
      // Web sends all of them in campus.location.id[$in].
      const selectedLocationValues =
        (filterValues.location as string[] | undefined) ?? [];
      const locationIds = locationRawMap
        .filter((loc) => selectedLocationValues.includes(loc.value))
        .flatMap((loc) => loc.locationIds)
        .filter(Boolean);

      // Duration filter — values are "min - max" strings
      const durationValues =
        (filterValues.duration as string[] | undefined) ?? [];
      const nbOfYearsMins: number[] = [];
      const nbOfYearsMaxs: number[] = [];
      for (const dv of durationValues) {
        const parts = dv.split(" - ");
        const mn = parseInt(parts[0] ?? "0", 10);
        const mx = parseInt(parts[1] ?? "0", 10);
        if (!isNaN(mn)) nbOfYearsMins.push(mn);
        if (!isNaN(mx)) nbOfYearsMaxs.push(mx);
      }

      // Language filter — values are language ids
      const languageIds =
        (filterValues.language as string[] | undefined) ?? [];

      // Tuition filter — stored as RangeValue [min, max] (numbers).
      // The slider bounds are [0, 3000]; a value of [0, 3000] means "untouched"
      // and must apply NO constraint (parity with web's 0–1000000 neutral default).
      // Only when the user has moved a thumb away from the full-range position
      // do we send the [$gte/$lte] params.
      const TUITION_SLIDER_MIN = 0;
      const TUITION_SLIDER_MAX = 3000;
      let tuitionMin: number | undefined;
      let tuitionMax: number | undefined;
      const tuitionVal = filterValues.tuition as RangeValue | undefined;
      if (tuitionVal && Array.isArray(tuitionVal) && typeof tuitionVal[0] === "number") {
        const [tMin, tMax] = tuitionVal;
        // Only treat as active if the user moved at least one thumb
        const isActive = tMin !== TUITION_SLIDER_MIN || tMax !== TUITION_SLIDER_MAX;
        if (isActive) {
          tuitionMin = tMin;
          tuitionMax = tMax;
        }
      }

      return {
        degreeIds: degreeIds.length > 0 ? degreeIds : undefined,
        fieldOfStudyIds: fieldOfStudyIds.length > 0 ? fieldOfStudyIds : undefined,
        locationIds: locationIds.length > 0 ? locationIds : undefined,
        nbOfYearsMins: nbOfYearsMins.length > 0 ? nbOfYearsMins : undefined,
        nbOfYearsMaxs: nbOfYearsMaxs.length > 0 ? nbOfYearsMaxs : undefined,
        languageIds: languageIds.length > 0 ? languageIds : undefined,
        tuitionMin,
        tuitionMax,
      };
    },
    []
  );

  return { buildFilterParams };
}
