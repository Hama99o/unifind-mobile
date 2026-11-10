import { useCustomTranslation } from "@/hooks/useCustomTranslation";

const BEIRUT_TZ = "Asia/Beirut";

/** The ONLY way to render dates/numbers/currency. Booking times display in
 * Beirut time (Asia/Beirut), matching the web. */
export function useLocalization() {
  const { lang } = useCustomTranslation();
  const locale = lang === "ar" ? "ar" : "en";

  const formatDate = (value: string | number | Date, opts?: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: BEIRUT_TZ,
      year: "numeric",
      month: "short",
      day: "numeric",
      ...opts,
    }).format(new Date(value));

  const formatTime = (value: string | number | Date) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: BEIRUT_TZ,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(value));

  const formatNumber = (value: number, opts?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(locale, opts).format(value);

  // Arabic: RLM + localized digits + a plain symbol after the number. Intl's Arabic
  // "US$" form splits into "$US" in RTL text, and Hermes ignores
  // currencyDisplay:"narrowSymbol" (QA BUG-05). English keeps Intl's output.
  const formatCurrency = (value: number, currency: "USD" | "LBP" = "USD") => {
    if (locale === "ar") {
      // Whole amounts without decimals so ranges fit their chips.
      const decimals = currency === "LBP" || Number.isInteger(value) ? 0 : 2;
      const amount = new Intl.NumberFormat("ar", {
        numberingSystem: "arab", // explicit: CLDR/ICU versions disagree on the "ar" default
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
      // Leading RLM: the amount reads right-to-left even inside text with no other
      // strong RTL character (e.g. a "300 $ – 400 $" price chip). Unicode isolates
      // were tried first but make Android mis-measure text (chips got ellipsized).
      return `\u200F${amount}\u00A0${currency === "USD" ? "$" : "ل.ل."}`;
    }
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
  };

  const formatPercent = (value: number) =>
    new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value);

  return { locale, formatDate, formatTime, formatNumber, formatCurrency, formatPercent };
}
