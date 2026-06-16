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

  const formatCurrency = (value: number, currency: "USD" | "LBP" = "USD") =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);

  const formatPercent = (value: number) =>
    new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value);

  return { locale, formatDate, formatTime, formatNumber, formatCurrency, formatPercent };
}
