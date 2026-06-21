/**
 * programExplorerApi — Strapi endpoints for the Program Explorer hub.
 * Backend: Strapi (http). Read-only catalog calls.
 *
 * Endpoints:
 *   GET /api/programs/fields-program-icons?status=draft&locale=<lang>
 *     Response: Array<{ fieldOfStudy: { id, name, icon, iconPrefix }, count }>
 *
 *   GET /api/programs/distinct-degrees-programs?status=draft&locale=<lang>
 *     Response: Array<{ degree: { id, title }, count }>
 *     (Reuses the same endpoint as programsFilterApi.fetchDegreeOptions but
 *      exposes it here so the hub doesn't import from the filter module.)
 */

import { http } from "@/api/http";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Item returned by /api/programs/fields-program-icons */
export interface FieldWithIconItem {
  fieldOfStudy: {
    id: number;
    name: string;
    /** FontAwesome icon name (without "fa-" prefix), e.g. "graduation-cap" */
    icon?: string;
    /** FA prefix, e.g. "fas" | "far" */
    iconPrefix?: string;
  };
  count: number;
}

/** Item returned by /api/programs/distinct-degrees-programs */
export interface DegreeItem {
  degree: {
    id: number;
    title: string;
  };
  count: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const programExplorerApi = {
  /**
   * Fetch fields of study with their FA icons.
   * Used by the Program Explorer hub Fields grid.
   * GET /api/programs/fields-program-icons
   */
  async fetchFieldOptionsWithIcons(
    locale: "en" | "ar"
  ): Promise<FieldWithIconItem[]> {
    try {
      const res = await http.get<FieldWithIconItem[]>(
        `/api/programs/fields-program-icons?status=draft&locale=${locale}`
      );
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch degree options for the hub Degrees grid.
   * GET /api/programs/distinct-degrees-programs
   */
  async fetchDegreeOptions(locale: "en" | "ar"): Promise<DegreeItem[]> {
    try {
      const res = await http.get<DegreeItem[]>(
        `/api/programs/distinct-degrees-programs?status=draft&locale=${locale}`
      );
      // Guard: must be a non-empty array (web had a bug guarding on Array.isArray(field) instead)
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },
};
