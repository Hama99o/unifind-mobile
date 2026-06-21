/**
 * useOfferingsData — data hook for the Find Offerings screen.
 *
 * H1 refactor: toggle/seed logic moved to useSelection. This hook now only
 * owns buildParams (its actual unique logic). isFavorite/toggleFavorite/
 * seedSelection come from useSelection directly.
 *
 * Does NOT own fetchPage directly — the screen owns that (to keep it simple
 * and avoid circular deps with the filter config). The hook exposes buildParams
 * so the screen's fetchPage can call it.
 */

import { useCallback } from "react";
import type { FilterValues } from "@/components/common/FilterDrawer";
import { buildOfferingNodeParams } from "@/config/offeringFilters";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOfferingsData() {
  // ── Filter params builder ───────────────────────────────────────────────────
  const buildParams = useCallback(
    (filterValues: FilterValues) =>
      buildOfferingNodeParams(filterValues as Record<string, unknown>),
    []
  );

  return { buildParams };
}
