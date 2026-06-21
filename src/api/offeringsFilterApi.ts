/**
 * offeringsFilterApi — Strapi filter endpoints for offerings.
 *
 * Endpoints (Strapi, read-only):
 *   GET /api/offerings/category-usage?status=draft&locale=<lang>
 *     Response: Array<{ category: { id, name, icon }, offerings: number[] }>
 *
 *   GET /api/offerings/field-usage?status=draft&locale=<lang>
 *     Response: Array<{ field: { id, name, icon, iconPrefix }, offerings: number[] }>
 *
 * Used by:
 *   - offeringFilters.ts (filter config for FilterDrawer)
 *   - GrowthCenterScreen (hub grid cards)
 */

import { http } from "@/api/http";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryUsageItem {
  category: {
    id: string | number;
    name: string;
    icon?: string;
  };
  /** Array of Strapi offering ids that belong to this category */
  offerings: number[];
}

export interface FieldUsageItem {
  field: {
    id: string | number;
    name: string;
    icon?: string;
    iconPrefix?: string;
  };
  /** Array of Strapi offering ids that belong to this field */
  offerings: number[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const offeringsFilterApi = {
  /** GET /api/offerings/category-usage */
  async fetchCategories(lang: "en" | "ar"): Promise<CategoryUsageItem[]> {
    try {
      const res = await http.get<CategoryUsageItem[]>(
        `/api/offerings/category-usage?status=draft&locale=${lang}`
      );
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  /** GET /api/offerings/field-usage */
  async fetchFields(lang: "en" | "ar"): Promise<FieldUsageItem[]> {
    try {
      const res = await http.get<FieldUsageItem[]>(
        `/api/offerings/field-usage?status=draft&locale=${lang}`
      );
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },
};
