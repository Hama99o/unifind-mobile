/**
 * catalogFormat — pure catalog-item formatting helpers.
 *
 * All functions are side-effect-free. Each accepts the necessary formatters
 * (t, formatCurrency, formatNumber) as arguments so there is no hook dependency.
 *
 * H2 fix: replaces 7+ copies of tuition/duration/campus/language/location
 * formatting scattered across cards and tabs:
 *   - Eliminates hardcoded "$" (use formatCurrency)
 *   - Eliminates hardcoded English "campuses" / "languages" (use t())
 *   - Adds the missing zero-guard in favorites/compare tabs (they were
 *     rendering fake "$0" when tuition was {minTuition:0, maxTuition:0})
 *   - Uses a single separator ("–") consistently
 */

// ─── Types (subset — no import cycle; callers pass plain objects) ──────────────

interface TuitionEntry {
  minTuition?: number | null;
  maxTuition?: number | null;
}

interface NbOfYears {
  min?: number | null;
  max?: number | null;
}

interface NbOfCredits {
  min?: number | null;
  max?: number | null;
}

interface CampusEntry {
  name?: string;
  location?: { city?: { name?: string } };
}

interface LanguageEntry {
  language?: string | null;
}

// ─── Tuition ──────────────────────────────────────────────────────────────────

/**
 * Format a single tuition range entry (min–max).
 * Returns "" (hidden) when both are 0 or both are missing.
 *
 * Bug fixed: favorites/compare tabs previously rendered "$0–$0"
 * because they had no zero-guard.
 */
export function formatTuitionRange(
  entry: TuitionEntry,
  formatCurrency: (v: number, currency?: "USD" | "LBP") => string
): string {
  const { minTuition, maxTuition } = entry;
  if (minTuition == null && maxTuition == null) return "";
  // Zero-guard: both explicitly zero → hide (no fake "$0")
  if (minTuition === 0 && maxTuition === 0) return "";

  if (minTuition != null && maxTuition != null) {
    if (minTuition === maxTuition) return formatCurrency(minTuition);
    return `${formatCurrency(minTuition)}–${formatCurrency(maxTuition)}`;
  }
  if (minTuition != null) return formatCurrency(minTuition);
  if (maxTuition != null) return formatCurrency(maxTuition);
  return "";
}

/**
 * Aggregate across multiple tuition entries (an institution's tuition[]).
 * Takes min-of-mins and max-of-maxes; hides when all entries are 0/missing.
 *
 * Bug fixed: InstitutionsFavoriteTab + InstitutionsCompareTab were computing
 * `$${Math.min(...mins)}–$${Math.max(...maxes)}` with hardcoded "$", no zero-guard,
 * and no i18n currency formatting.
 */
export function formatInstitutionTuition(
  tuitions: TuitionEntry[],
  formatCurrency: (v: number, currency?: "USD" | "LBP") => string
): string {
  if (!tuitions || tuitions.length === 0) return "";
  const mins: number[] = [];
  const maxes: number[] = [];
  for (const t of tuitions) {
    if (t.minTuition != null) mins.push(t.minTuition);
    if (t.maxTuition != null) maxes.push(t.maxTuition);
  }
  if (mins.length === 0 && maxes.length === 0) return "";
  const globalMin = mins.length ? Math.min(...mins) : maxes[0]!;
  const globalMax = maxes.length ? Math.max(...maxes) : mins[0]!;
  // Zero-guard
  if (globalMin === 0 && globalMax === 0) return "";
  return formatTuitionRange({ minTuition: globalMin, maxTuition: globalMax }, formatCurrency);
}

// ─── Duration ─────────────────────────────────────────────────────────────────

/**
 * Format nbOfYears into a localized duration string.
 * Returns "" when no data.
 *
 * Bug fixed: ProgramsFavoriteTab had hardcoded English "years"; now uses t().
 */
export function formatDuration(
  nbOfYears: NbOfYears | null | undefined,
  t: (key: string) => string,
  formatNumber: (n: number) => string = String
): string {
  if (!nbOfYears) return "";
  const { min, max } = nbOfYears;
  if (min == null && max == null) return "";
  const n = formatNumber;

  if (min != null && max != null) {
    if (min === max) {
      if (min === 1) return `${n(1)} ${t("year")}`;
      // Dual: the key already carries the number ("2 Years" / "سنتان").
      if (min === 2) return t("towYears");
      return `${n(min)} ${t("nbYears")}`;
    }
    return `${n(min)}–${n(max)} ${t("nbYears")}`;
  }
  if (min != null) return `${n(min)} ${t("nbYears")}`;
  if (max != null) return `${n(max)} ${t("nbYears")}`;
  return "";
}

// ─── Credits ──────────────────────────────────────────────────────────────────

/**
 * Format nbOfCredits into a string.
 * Returns "" when no data.
 */
export function formatCredits(
  nbOfCredits: NbOfCredits | null | undefined,
  t: (key: string) => string
): string {
  if (!nbOfCredits) return "";
  const { min, max } = nbOfCredits;
  if (min == null && max == null) return "";

  if (min != null && max != null) {
    if (min === max) return `${min} ${t("credits")}`;
    return `${min}–${max} ${t("credits")}`;
  }
  if (min != null) return `${min} ${t("credits")}`;
  if (max != null) return `${max} ${t("credits")}`;
  return "";
}

// ─── Campus ───────────────────────────────────────────────────────────────────

/**
 * Format a campus array into a compact label.
 * - 0 → ""
 * - 1 → city name (or campus name) of the single campus
 * - N → "N campuses" (i18n)
 *
 * Bug fixed: ProgramsFavoriteTab + ProgramCard used hardcoded English "campuses".
 */
export function formatCampusLabel(
  campus: CampusEntry[],
  opts: {
    t: (key: string) => string;
    formatNumber: (v: number) => string;
  }
): string {
  if (!campus || campus.length === 0) return "";
  if (campus.length === 1) {
    return campus[0].location?.city?.name ?? campus[0].name ?? "";
  }
  return `${opts.formatNumber(campus.length)} ${opts.t("campuses")}`;
}

// ─── Language ─────────────────────────────────────────────────────────────────

/**
 * Format a languages array into a compact label.
 * - 0 → ""
 * - 1 → language name
 * - N → "N languages" (i18n)
 *
 * Bug fixed: ProgramsFavoriteTab + ProgramCard used hardcoded English "languages".
 */
export function formatLanguageLabel(
  languages: LanguageEntry[],
  opts: {
    t: (key: string) => string;
    formatNumber: (v: number) => string;
  }
): string {
  if (!languages || languages.length === 0) return "";
  if (languages.length === 1) {
    return languages[0].language ?? "";
  }
  return `${opts.formatNumber(languages.length)} ${opts.t("languages")}`;
}

// ─── Location ─────────────────────────────────────────────────────────────────

/**
 * Format city + country into "City, Country" (or just city when country is absent).
 */
export function formatLocation(
  city: string | null | undefined,
  country: string | null | undefined
): string {
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  return "";
}
