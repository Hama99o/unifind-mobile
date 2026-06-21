/**
 * programsFilterApi — Strapi filter-source endpoints for Find Programs.
 * Backend: Strapi (http). All endpoints are read-only catalog calls.
 *
 * Split from programsApi.ts to keep files under ~300 lines.
 *
 * Endpoints:
 *   GET /api/programs/distinct-degrees-programs  → degree filter options
 *   GET /api/programs/fields-program-ids          → field-of-study filter options
 *   GET /api/programs/durations                   → duration filter options
 *   GET /api/programs/language-usage              → language filter options
 *   GET /api/programs?populate[institution][tuition] → tuition range options
 *   GET /api/programs?fields=id&populate campus.location → location options
 */

import { http } from "@/api/http";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface DegreeFilterOption {
  degree: { id: number; title: string };
  count: number;
}

export interface FieldFilterOption {
  fieldOfStudy: { id: number; name: string };
  count: number;
}

export interface DurationFilterOption {
  min: number;
  max: number;
  count: number;
}

export interface LanguageFilterOption {
  language: { id: number; language: string };
  count: number;
}

export interface ProgramLocationRaw {
  label: string;      // city name
  gov: string;        // governorate
  value: string;      // "gov,city"
  /** ALL location ids for this city (multiple campuses possible per city) */
  locationIds: string[];
  /** @deprecated use locationIds (kept for one-to-one compat, equals locationIds[0]) */
  locationId: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const programsFilterApi = {
  /**
   * Fetch degree filter options for programs.
   * Endpoint: /api/programs/distinct-degrees-programs
   * Returns [{ degree: { id, title }, count }]
   */
  async fetchDegreeOptions(locale: "en" | "ar"): Promise<FilterOption[]> {
    const res = await http.get<DegreeFilterOption[]>(
      `/api/programs/distinct-degrees-programs?status=draft&locale=${locale}`
    );
    const data = res.data ?? [];
    return data.map((item) => ({
      label: item.degree.title,
      value: String(item.degree.id),
      count: item.count,
    }));
  },

  /**
   * Fetch field-of-study filter options for programs.
   * Endpoint: /api/programs/fields-program-ids
   * Returns [{ fieldOfStudy: { id, name }, count }]
   */
  async fetchFieldOptions(locale: "en" | "ar"): Promise<FilterOption[]> {
    const res = await http.get<FieldFilterOption[]>(
      `/api/programs/fields-program-ids?status=draft&locale=${locale}`
    );
    const data = res.data ?? [];
    return data.map((item) => ({
      label: item.fieldOfStudy.name,
      value: String(item.fieldOfStudy.id),
      count: item.count,
    }));
  },

  /**
   * Fetch duration filter options.
   * Endpoint: /api/programs/durations
   * Returns [{ min, max, count }] sorted by min asc.
   */
  async fetchDurationOptions(): Promise<FilterOption[]> {
    const res = await http.get<DurationFilterOption[]>(
      `/api/programs/durations?status=draft&locale=en`
    );
    const data = (res.data ?? []).slice().sort((a, b) => a.min - b.min);
    return data.map((item) => {
      const { min, max, count } = item;
      let label = "";
      if (min && max) {
        label =
          min === max
            ? `${min} ${min === 1 ? "Year" : "Years"}`
            : `${min} - ${max} Years`;
      } else if (min) {
        label = `${min} Years`;
      } else if (max) {
        label = `${max} Years`;
      } else {
        label = "0 Years";
      }
      return {
        label,
        value: `${min} - ${max}`,
        count,
      };
    });
  },

  /**
   * Fetch language filter options.
   * Endpoint: /api/programs/language-usage
   * Returns [{ language: { id, language }, count }]
   */
  async fetchLanguageOptions(locale: "en" | "ar"): Promise<FilterOption[]> {
    const res = await http.get<LanguageFilterOption[]>(
      `/api/programs/language-usage?status=draft&locale=${locale}`
    );
    const data = res.data ?? [];
    return data.map((item) => ({
      label: item.language.language,
      value: String(item.language.id),
      count: item.count,
    }));
  },

  /**
   * Fetch campus location options for programs.
   * Endpoint: /api/programs (fields=id + populate campus.location)
   * Returns unique locations as { label, gov, value: "gov,city", locationId }.
   */
  async fetchLocationOptions(
    locale: "en" | "ar"
  ): Promise<ProgramLocationRaw[]> {
    const qp = new URLSearchParams();
    qp.append("filters[locale][$eq]", locale);
    qp.append("fields[0]", "id");
    qp.append("populate[campus][fields][0]", "name");
    qp.append("populate[campus][populate][location][fields][0]", "street");
    qp.append(
      "populate[campus][populate][location][populate][city][fields][0]",
      "name"
    );
    qp.append(
      "populate[campus][populate][location][populate][district][fields][0]",
      "governorate"
    );
    qp.append("pagination[page]", "1");
    qp.append("pagination[pageSize]", "500");
    qp.append("status", "draft");

    const res = await http.get<{
      data: Array<{
        campus?: Array<{
          location?: {
            id?: number;
            city?: { name?: string };
            district?: { governorate?: string };
          };
        }>;
      }>;
    }>(`/api/programs?${qp.toString()}`);

    const programs = res.data?.data ?? [];
    // Map of "gov,city" → { label, gov, value, locationIds[] }
    const uniqueMap = new Map<string, { label: string; gov: string; value: string; locationIds: Set<string> }>();

    for (const prog of programs) {
      for (const campus of prog.campus ?? []) {
        const cityName = campus.location?.city?.name ?? "";
        const gov = campus.location?.district?.governorate ?? "";
        const locationId = String(campus.location?.id ?? "");
        if (!cityName || !locationId) continue;
        const key = `${gov},${cityName}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, { label: cityName, gov, value: key, locationIds: new Set() });
        }
        // Collect ALL location ids for this city (one per campus)
        uniqueMap.get(key)!.locationIds.add(locationId);
      }
    }

    return Array.from(uniqueMap.values()).map((entry) => {
      const ids = Array.from(entry.locationIds);
      return {
        label: entry.label,
        gov: entry.gov,
        value: entry.value,
        locationIds: ids,
        locationId: ids[0] ?? "", // back-compat
      };
    });
  },
};
