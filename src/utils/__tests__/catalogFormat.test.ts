/**
 * catalogFormat.test.ts — unit tests for pure catalog-item formatting helpers.
 *
 * All functions are side-effect-free and accept formatters as arguments,
 * so no RN modules or hooks are needed here.  Pure TS, runs offline.
 *
 * Coverage:
 *   formatTuitionRange   — normal, equal, one-sided, zero-guard, null-guard
 *   formatInstitutionTuition — aggregate across multiple entries + zero-guard
 *   formatDuration       — single/range/singular/dual/plural via stub t()
 *   formatCredits        — same patterns as duration
 *   formatCampusLabel    — 0 / 1 / N campuses, city-name fallback
 *   formatLanguageLabel  — 0 / 1 / N languages
 *   formatLocation       — city+country / city-only / country-only / both null
 */

import {
  formatTuitionRange,
  formatInstitutionTuition,
  formatDuration,
  formatCredits,
  formatCampusLabel,
  formatLanguageLabel,
  formatLocation,
} from "@/utils/catalogFormat";

// ─── Stubs ────────────────────────────────────────────────────────────────────

/** Identity t() — returns the key so assertions are key-based and locale-agnostic. */
const t = (key: string) => key;

/**
 * Simple USD currency formatter.
 * Matches the shape useLocalization().formatCurrency returns for USD.
 */
const formatCurrency = (v: number, _currency?: "USD" | "LBP") => `$${v.toLocaleString()}`;

/** Identity number formatter. */
const formatNumber = (v: number) => String(v);

// ─── formatTuitionRange ───────────────────────────────────────────────────────

describe("formatTuitionRange", () => {
  it("returns a range when min < max", () => {
    expect(formatTuitionRange({ minTuition: 5000, maxTuition: 10000 }, formatCurrency)).toBe(
      "$5,000–$10,000"
    );
  });

  it("returns a single value when min === max", () => {
    expect(formatTuitionRange({ minTuition: 7500, maxTuition: 7500 }, formatCurrency)).toBe(
      "$7,500"
    );
  });

  it("returns minTuition when maxTuition is null", () => {
    expect(formatTuitionRange({ minTuition: 3000, maxTuition: null }, formatCurrency)).toBe(
      "$3,000"
    );
  });

  it("returns maxTuition when minTuition is null", () => {
    expect(formatTuitionRange({ minTuition: null, maxTuition: 8000 }, formatCurrency)).toBe(
      "$8,000"
    );
  });

  it("returns '' when both are null (missing data)", () => {
    expect(formatTuitionRange({ minTuition: null, maxTuition: null }, formatCurrency)).toBe("");
  });

  it("zero-guard: returns '' when both are 0 (no fake '$0–$0')", () => {
    expect(formatTuitionRange({ minTuition: 0, maxTuition: 0 }, formatCurrency)).toBe("");
  });

  it("returns formatted value when only minTuition is 0", () => {
    // One side is 0 but the other is meaningful — still show it
    const result = formatTuitionRange({ minTuition: 0, maxTuition: 5000 }, formatCurrency);
    expect(result).toBe("$0–$5,000");
  });
});

// ─── formatInstitutionTuition ─────────────────────────────────────────────────

describe("formatInstitutionTuition", () => {
  it("aggregates min-of-mins and max-of-maxes", () => {
    const tuitions = [
      { minTuition: 3000, maxTuition: 6000 },
      { minTuition: 1000, maxTuition: 8000 },
      { minTuition: 4000, maxTuition: 7000 },
    ];
    expect(formatInstitutionTuition(tuitions, formatCurrency)).toBe("$1,000–$8,000");
  });

  it("returns '' for empty array", () => {
    expect(formatInstitutionTuition([], formatCurrency)).toBe("");
  });

  it("zero-guard: returns '' when all entries are 0/0", () => {
    const tuitions = [
      { minTuition: 0, maxTuition: 0 },
      { minTuition: 0, maxTuition: 0 },
    ];
    expect(formatInstitutionTuition(tuitions, formatCurrency)).toBe("");
  });

  it("returns single value when only one entry with equal min/max", () => {
    expect(formatInstitutionTuition([{ minTuition: 5000, maxTuition: 5000 }], formatCurrency)).toBe(
      "$5,000"
    );
  });

  it("handles entries with only minTuition", () => {
    const tuitions = [{ minTuition: 2000 }, { minTuition: 4000 }];
    const result = formatInstitutionTuition(tuitions, formatCurrency);
    // No maxTuition anywhere → globalMax falls back to the first min (mins[0]),
    // so globalMin === globalMax and the range collapses to a single value.
    expect(result).toBe("$2,000");
  });
});

// ─── formatDuration ───────────────────────────────────────────────────────────

describe("formatDuration", () => {
  it("returns '1 year' for min=1 max=1", () => {
    expect(formatDuration({ min: 1, max: 1 }, t)).toBe("1 year");
  });

  it("returns the dual key alone for min=2 max=2 (towYears already has the number)", () => {
    // en "2 Years", ar "سنتان" — prefixing the number gave "2 2 Years".
    expect(formatDuration({ min: 2, max: 2 }, t)).toBe("towYears");
  });

  it("formats every number with formatNumber (Arabic digits in ar)", () => {
    const ar = (n: number) => n.toLocaleString("ar", { numberingSystem: "arab" } as Intl.NumberFormatOptions);
    expect(formatDuration({ min: 4, max: 4 }, t, ar)).toBe("٤ nbYears");
    expect(formatDuration({ min: 1, max: 1 }, t, ar)).toBe("١ year");
    expect(formatDuration({ min: 2, max: 5 }, t, ar)).toBe("٢–٥ nbYears");
    expect(formatDuration({ max: 3 }, t, ar)).toBe("٣ nbYears");
  });

  it("returns 'N nbYears' for min=4 max=4", () => {
    expect(formatDuration({ min: 4, max: 4 }, t)).toBe("4 nbYears");
  });

  it("returns a range when min < max", () => {
    expect(formatDuration({ min: 2, max: 4 }, t)).toBe("2–4 nbYears");
  });

  it("returns '' for null input", () => {
    expect(formatDuration(null, t)).toBe("");
  });

  it("returns '' when both min and max are null", () => {
    expect(formatDuration({ min: null, max: null }, t)).toBe("");
  });

  it("handles only min present", () => {
    expect(formatDuration({ min: 3 }, t)).toBe("3 nbYears");
  });

  it("handles only max present", () => {
    expect(formatDuration({ max: 5 }, t)).toBe("5 nbYears");
  });
});

// ─── formatCredits ────────────────────────────────────────────────────────────

describe("formatCredits", () => {
  it("returns single value when min === max", () => {
    expect(formatCredits({ min: 120, max: 120 }, t)).toBe("120 credits");
  });

  it("returns a range when min < max", () => {
    expect(formatCredits({ min: 90, max: 120 }, t)).toBe("90–120 credits");
  });

  it("returns '' for null input", () => {
    expect(formatCredits(null, t)).toBe("");
  });

  it("returns '' when both null", () => {
    expect(formatCredits({ min: null, max: null }, t)).toBe("");
  });

  it("handles only min", () => {
    expect(formatCredits({ min: 60 }, t)).toBe("60 credits");
  });
});

// ─── formatCampusLabel ────────────────────────────────────────────────────────

describe("formatCampusLabel", () => {
  it("returns '' for empty array", () => {
    expect(formatCampusLabel([], { t, formatNumber })).toBe("");
  });

  it("returns city name for single campus", () => {
    const campus = [{ name: "Main Campus", location: { city: { name: "Beirut" } } }];
    expect(formatCampusLabel(campus, { t, formatNumber })).toBe("Beirut");
  });

  it("falls back to campus name when city is absent", () => {
    const campus = [{ name: "Online Campus" }];
    expect(formatCampusLabel(campus, { t, formatNumber })).toBe("Online Campus");
  });

  it("returns 'N campuses' for multiple campuses (i18n key)", () => {
    const campus = [
      { name: "Campus A", location: { city: { name: "Beirut" } } },
      { name: "Campus B", location: { city: { name: "Tripoli" } } },
      { name: "Campus C", location: { city: { name: "Sidon" } } },
    ];
    expect(formatCampusLabel(campus, { t, formatNumber })).toBe("3 campuses");
  });
});

// ─── formatLanguageLabel ──────────────────────────────────────────────────────

describe("formatLanguageLabel", () => {
  it("returns '' for empty array", () => {
    expect(formatLanguageLabel([], { t, formatNumber })).toBe("");
  });

  it("returns the language name for a single entry", () => {
    expect(formatLanguageLabel([{ language: "English" }], { t, formatNumber })).toBe("English");
  });

  it("returns 'N languages' for multiple entries (i18n key)", () => {
    const langs = [{ language: "English" }, { language: "French" }];
    expect(formatLanguageLabel(langs, { t, formatNumber })).toBe("2 languages");
  });

  it("returns '' when the single entry has no language string", () => {
    expect(formatLanguageLabel([{ language: null }], { t, formatNumber })).toBe("");
  });
});

// ─── formatLocation ───────────────────────────────────────────────────────────

describe("formatLocation", () => {
  it("formats city + country", () => {
    expect(formatLocation("Beirut", "Lebanon")).toBe("Beirut, Lebanon");
  });

  it("returns city when country is absent", () => {
    expect(formatLocation("Beirut", null)).toBe("Beirut");
  });

  it("returns country when city is absent", () => {
    expect(formatLocation(null, "Lebanon")).toBe("Lebanon");
  });

  it("returns '' when both are absent", () => {
    expect(formatLocation(null, null)).toBe("");
  });

  it("returns '' when both are undefined", () => {
    expect(formatLocation(undefined, undefined)).toBe("");
  });
});
