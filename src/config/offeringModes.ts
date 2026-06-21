/**
 * offeringModes — canonical offering mode config.
 *
 * M4 fix: BookingSessionCard.tsx had hardcoded English MODE_LABELS
 * ("Group Live", "1-on-1") while OfferingSpecialistSection had an i18n
 * getModeLabel. This module is the single source of truth for both.
 *
 * Usage:
 *   import { getModeLabel, MODE_ORDER, sortByMode } from "@/config/offeringModes";
 */

export const MODE_ORDER = ["group_live", "group_online", "1o1"] as const;
export type OfferingMode = (typeof MODE_ORDER)[number];

/**
 * Returns the i18n label for an offering mode.
 * Falls back to the raw mode string for unknown values.
 *
 * Bug fixed: BookingSessionCard had hardcoded English; now uses t().
 */
export function getModeLabel(mode: string, t: (k: string) => string): string {
  if (mode === "group_live") return t("modeGroupLive");
  if (mode === "group_online") return t("modeGroupOnline");
  if (mode === "1o1") return t("mode1o1");
  return mode;
}

/**
 * Sort an array of objects that have a `.mode` field according to MODE_ORDER.
 * Unknown modes sort after known ones (stable order preserved).
 */
export function sortByMode<T extends { mode: string }>(eventTypes: T[]): T[] {
  return [...eventTypes].sort((a, b) => {
    const ia = MODE_ORDER.indexOf(a.mode as OfferingMode);
    const ib = MODE_ORDER.indexOf(b.mode as OfferingMode);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return 0;
  });
}
