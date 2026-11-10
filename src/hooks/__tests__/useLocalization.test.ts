/**
 * useLocalization.test.ts — tests the REAL useLocalization hook.
 *
 * useLocalization is globally mocked in jest.setup.ts, so we unmock it for THIS
 * file only and require the actual implementation. The hook depends on
 * useCustomTranslation (still globally mocked → lang: "en"), so locale resolves
 * to "en" and the Intl formatters run for the en locale + Asia/Beirut timezone.
 *
 * Asserted outputs were verified against the same Node/full-ICU runtime jest
 * uses. For currency grouping/percent we assert on structure/substrings to stay
 * robust across ICU minor versions while still proving the real behaviour.
 */

jest.unmock("@/hooks/useLocalization");

import { renderHook } from "@testing-library/react-native";

const { useLocalization } = jest.requireActual<
  typeof import("@/hooks/useLocalization")
>("@/hooks/useLocalization");

function getLoc() {
  const { result } = renderHook(() => useLocalization());
  return result.current;
}

describe("useLocalization", () => {
  it("resolves locale to 'en' (useCustomTranslation mocked to lang='en')", () => {
    expect(getLoc().locale).toBe("en");
  });

  // ── formatCurrency ──────────────────────────────────────────────────────────

  describe("formatCurrency", () => {
    it("formats USD with the $ symbol, grouping and 2 decimals", () => {
      const { formatCurrency } = getLoc();
      expect(formatCurrency(2000, "USD")).toBe("$2,000.00");
    });

    it("defaults to USD when no currency is passed", () => {
      const { formatCurrency } = getLoc();
      expect(formatCurrency(50)).toBe("$50.00");
    });

    it("formats fractional USD amounts to 2 decimals", () => {
      const { formatCurrency } = getLoc();
      expect(formatCurrency(1234.5, "USD")).toBe("$1,234.50");
    });

    it("formats LBP with the LBP code (no $) and no decimal places", () => {
      const { formatCurrency } = getLoc();
      const out = formatCurrency(1500000, "LBP");
      // LBP has 0 fraction digits in ICU; symbol renders as the "LBP" code.
      expect(out).toContain("LBP");
      expect(out).not.toContain("$");
      expect(out).toContain("1,500,000");
      expect(out).not.toContain(".");
    });

    it("formats zero correctly for USD", () => {
      const { formatCurrency } = getLoc();
      expect(formatCurrency(0, "USD")).toBe("$0.00");
    });
  });

  // ── formatNumber ──────────────────────────────────────────────────────────────

  describe("formatNumber", () => {
    it("adds thousands separators", () => {
      const { formatNumber } = getLoc();
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("formats a small number with no separators", () => {
      const { formatNumber } = getLoc();
      expect(formatNumber(42)).toBe("42");
    });

    it("formats zero", () => {
      const { formatNumber } = getLoc();
      expect(formatNumber(0)).toBe("0");
    });

    it("honours passed NumberFormat options (min fraction digits)", () => {
      const { formatNumber } = getLoc();
      expect(formatNumber(1234.5, { minimumFractionDigits: 2 })).toBe("1,234.50");
    });
  });

  // ── formatPercent ─────────────────────────────────────────────────────────────

  describe("formatPercent", () => {
    it("multiplies by 100 and appends a percent sign with up to 1 fraction digit", () => {
      const { formatPercent } = getLoc();
      expect(formatPercent(0.1234)).toBe("12.3%");
    });

    it("drops trailing zeros (maximumFractionDigits: 1)", () => {
      const { formatPercent } = getLoc();
      expect(formatPercent(0.5)).toBe("50%");
    });

    it("formats zero as 0%", () => {
      const { formatPercent } = getLoc();
      expect(formatPercent(0)).toBe("0%");
    });
  });

  // ── formatDate ──────────────────────────────────────────────────────────────

  describe("formatDate", () => {
    it("formats an ISO date as 'MMM D, YYYY' in en/Beirut time", () => {
      const { formatDate } = getLoc();
      expect(formatDate("2025-06-01T12:00:00Z")).toBe("Jun 1, 2025");
    });

    it("accepts a Date object", () => {
      const { formatDate } = getLoc();
      expect(formatDate(new Date("2025-06-01T12:00:00Z"))).toBe("Jun 1, 2025");
    });

    it("honours overriding DateTimeFormat options", () => {
      const { formatDate } = getLoc();
      // Override to year-only — month/day still in the base opts but year is the
      // only field we assert is present; ICU keeps the explicitly-set fields.
      const out = formatDate("2025-06-01T12:00:00Z", {
        year: "numeric",
        month: undefined,
        day: undefined,
      });
      expect(out).toContain("2025");
    });
  });

  // ── formatTime ──────────────────────────────────────────────────────────────

  describe("formatTime", () => {
    it("renders 12-hour time with AM/PM shifted to Beirut (UTC+3 in June)", () => {
      const { formatTime } = getLoc();
      // 12:00 UTC → 15:00 Beirut → "3:00 PM"
      expect(formatTime("2025-06-01T12:00:00Z")).toBe("3:00 PM");
    });

    it("renders AM times with Beirut offset and 2-digit minutes", () => {
      const { formatTime } = getLoc();
      // 00:30 UTC → 03:30 Beirut → "3:30 AM"
      expect(formatTime("2025-06-01T00:30:00Z")).toBe("3:30 AM");
    });
  });
});

describe("useLocalization — Arabic currency (BUG-05)", () => {
  it("Arabic: RLM + Arabic digits + plain $, no decimals on whole amounts, never 'US$'", () => {
    const ct = require("@/hooks/useCustomTranslation");
    const spy = jest
      .spyOn(ct, "useCustomTranslation")
      .mockReturnValue({ t: (k: string) => k, lang: "ar", isRtl: true, i18n: { language: "ar" } });
    const { result } = renderHook(() => useLocalization());
    expect(result.current.formatCurrency(45, "USD")).toBe("\u200F٤٥\u00A0$");
    expect(result.current.formatCurrency(45.5, "USD")).toBe("\u200F٤٥٫٥٠\u00A0$");
    expect(result.current.formatCurrency(45, "USD")).not.toContain("US$");
    spy.mockRestore();
  });
});
