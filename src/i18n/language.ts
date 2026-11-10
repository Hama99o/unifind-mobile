/**
 * App language: switch + persist + restore at boot.
 *
 * RTL note: the app mirrors its layout by hand (`isRtl` from useCustomTranslation →
 * row-reverse / textAlign in ~100 places) and keeps native layout LTR
 * (no `supportsRTL` in app.json). Do NOT call I18nManager.forceRTL: it would flip
 * every hand-mirrored row back to LTR. Native-only pieces (the tab bar) are
 * mirrored with the Yoga `direction` style instead.
 */

import i18n from "@/i18n";
import { secureStorage } from "@/utils/secure-storage";

export const SUPPORTED_LANGS = ["en", "ar"] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];
export const LANG_STORAGE_KEY = "uf.lang";

function isSupported(lng: string | null | undefined): lng is AppLang {
  return !!lng && (SUPPORTED_LANGS as readonly string[]).includes(lng);
}

/** Switch the UI language and remember it for the next launch. */
export async function setAppLanguage(lng: string): Promise<void> {
  if (!isSupported(lng)) return;
  await i18n.changeLanguage(lng);
  try {
    await secureStorage.set(LANG_STORAGE_KEY, lng);
  } catch {
    // Storage failure must never block the switch itself.
  }
}

/** Apply the stored language (if any). Resolves to the active language. */
export async function restoreAppLanguage(): Promise<string> {
  try {
    const stored = await secureStorage.get(LANG_STORAGE_KEY);
    if (isSupported(stored) && stored !== i18n.language) {
      await i18n.changeLanguage(stored);
    }
  } catch {
    // Fall back to the default language.
  }
  return i18n.language;
}
