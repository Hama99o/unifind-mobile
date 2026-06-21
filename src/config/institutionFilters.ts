/**
 * institutionFilters — filter config for the Find Institutions screen.
 * Passed to UniversalList config.filters.
 * FILTER_DRAWER.md is the spec.
 *
 * 4 filters (exact web parity):
 *   1. Degree Level (multiSelect, accordion) — from /api/programs/distinct-degrees
 *   2. Field of Study (multiSelect, accordion) — from /api/programs/fields-institution-ids
 *   3. Location (multiSelect, accordion) — from /api/campuses
 *   4. Tuition Fees (singleSelect) — from tuition range options built from all institution data
 *
 * The filter config is a function so labels can be translated at call time.
 */

import { institutionsApi } from "@/api/institutionsApi";
import type { FilterConfig, FilterOption } from "@/components/common/FilterDrawer";

/**
 * Build the institution filter config.
 * @param t — t() from useCustomTranslation
 * @param locale — current app locale
 */
export function buildInstitutionFilterConfig(
  t: (key: string) => string,
  locale: "en" | "ar"
): FilterConfig[] {
  return [
    {
      key: "degreeLevel",
      label: t("degreeLevel"),
      type: "multiSelect",
      presentation: "accordion",
      fetchOptions: async (): Promise<FilterOption[]> => {
        const raw = await institutionsApi.fetchDegreeFilterOptions(locale);
        return raw.map((item) => ({
          label: item.degree.title,
          // value = comma-joined institution ids (mirrors web selectedDegreeIds logic)
          value: item.institutions,
          count: item.count,
        }));
      },
    },
    {
      key: "fieldOfStudy",
      label: t("fields"),
      type: "multiSelect",
      presentation: "accordion",
      fetchOptions: async (): Promise<FilterOption[]> => {
        const raw = await institutionsApi.fetchFieldFilterOptions(locale);
        return raw.map((item) => ({
          label: item.fieldOfStudy.name,
          // value = comma-joined institution ids
          value: item.institutions,
          count: item.count,
        }));
      },
    },
    {
      key: "location",
      label: t("location"),
      type: "location",
      presentation: "accordion",
      fetchOptions: async (): Promise<FilterOption[]> => {
        const raw = await institutionsApi.fetchLocationFilterOptions(locale);
        return raw.map((item) => ({
          label: item.label,
          value: item.value, // "gov,city"
          gov: item.gov,     // governorate for grouped display
          count: undefined,
        }));
      },
    },
    {
      key: "tuition",
      label: t("tuitionFees"),
      type: "singleSelect",
      unit: "$",
      // Tuition options are fetched from all institution data (mirrors web tuitionRangeCountMap).
      // fetchOptions triggers inside FilterDrawer when it opens.
      fetchOptions: async (): Promise<FilterOption[]> =>
        institutionsApi.fetchTuitionFilterOptions(locale),
    },
  ];
}
