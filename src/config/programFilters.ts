/**
 * programFilters — filter config for the Find Programs screen.
 * Passed to UniversalList config.filters.
 * FILTER_DRAWER.md is the authoritative spec.
 *
 * 6 filters IN ORDER (exact web parity):
 *   1. Degree Level        (multiSelect, accordion)
 *   2. Field of Study      (multiSelect, accordion)
 *   3. Location            (multiSelect, accordion) — "gov,city" → campus.location.id
 *   4. Tuition Fees        (range slider, min 0 max 3000 step 50) — [min,max] tuple
 *   5. Duration            (multiSelect, accordion) — "min-max" → nbOfYears.min/max[$in]
 *   6. Language            (multiSelect, accordion) — language id
 */

import { programsFilterApi } from "@/api/programsFilterApi";
import type { FilterConfig, FilterOption } from "@/components/common/FilterDrawer";

/**
 * Build the program filter config.
 * @param t — t() from useCustomTranslation
 * @param locale — current app locale
 */
export function buildProgramFilterConfig(
  t: (key: string) => string,
  locale: "en" | "ar"
): FilterConfig[] {
  return [
    {
      key: "degree",
      label: t("degreeLevel"),
      type: "multiSelect",
      presentation: "accordion",
      fetchOptions: async (): Promise<FilterOption[]> =>
        programsFilterApi.fetchDegreeOptions(locale),
    },
    {
      key: "fieldOfStudy",
      label: t("fields"),
      type: "multiSelect",
      presentation: "accordion",
      fetchOptions: async (): Promise<FilterOption[]> =>
        programsFilterApi.fetchFieldOptions(locale),
    },
    {
      key: "location",
      label: t("location"),
      type: "location",
      presentation: "accordion",
      fetchOptions: async (): Promise<FilterOption[]> => {
        const raw = await programsFilterApi.fetchLocationOptions(locale);
        return raw.map((item) => ({
          label: item.label,
          value: item.value, // "gov,city"
          gov: item.gov,     // governorate for grouped display
        }));
      },
    },
    {
      key: "tuition",
      label: t("tuitionFees"),
      type: "range",
      min: 0,
      max: 3000,
      step: 50,
      unit: "$",
    },
    {
      key: "duration",
      label: t("duration"),
      type: "multiSelect",
      presentation: "accordion",
      fetchOptions: async (): Promise<FilterOption[]> =>
        programsFilterApi.fetchDurationOptions(),
    },
    {
      key: "language",
      label: t("language"),
      type: "multiSelect",
      presentation: "accordion",
      fetchOptions: async (): Promise<FilterOption[]> =>
        programsFilterApi.fetchLanguageOptions(locale),
    },
  ];
}
