import { useTranslation } from "react-i18next";
import { isRtlLang } from "@/i18n";

/** App translation hook — `t`, current language, and RTL flag. */
export function useCustomTranslation() {
  const { t, i18n } = useTranslation();
  return { t, i18n, lang: i18n.language, isRtl: isRtlLang(i18n.language) };
}
