import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";
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

/** Apply RTL layout for a language. Call on language change. */
export function applyDirection(lng: string) {
  const rtl = isRtlLang(lng);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
    // A reload is required for native to re-layout; handled by the caller.
  }
}

export default i18n;
