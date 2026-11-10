import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import ar from "./locales/ar/translation.json";

export const RTL_LANGS = ["ar"];
export const DEFAULT_LANG = process.env.EXPO_PUBLIC_DEFAULT_LANG || "en";

export function isRtlLang(lng: string) {
  return RTL_LANGS.includes(lng);
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: DEFAULT_LANG,
    fallbackLng: "en",
    ns: ["translation"],
    defaultNS: "translation",
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

// RTL: layout is mirrored by hand (useCustomTranslation().isRtl); native layout
// stays LTR on purpose. Never call I18nManager.forceRTL — see src/i18n/language.ts.

export default i18n;
