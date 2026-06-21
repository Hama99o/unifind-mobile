/**
 * shareLink — cross-platform share utility.
 *
 * WEB:
 *   - If navigator.share exists → native Web Share API (mobile browsers, PWA).
 *   - Else if navigator.clipboard exists → copy to clipboard + show toast.
 *   - Else → show toast with the URL.
 *
 * NATIVE (iOS/Android):
 *   - Uses RN core Share.share (always available; no external package needed).
 *
 * Platform.OS branch is used here (not a file split) because the imports
 * from 'react-native' (Share, Platform) are bundled for both targets by
 * React Native Web — Share is shimmed on web but does not support all
 * methods, so we guard with the navigator APIs directly.
 *
 * Never crashes on any platform.
 */

import { Platform, Share } from "react-native";
import { showToast } from "@/stores/toastStore";
import i18n from "@/i18n";

/**
 * Share a URL with an optional title.
 * On web: uses navigator.share / navigator.clipboard / fallback toast.
 * On native: uses RN Share.share.
 */
export async function shareLink(url: string, title?: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      // Modern browser share sheet (mobile Safari / Chrome on Android)
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        await navigator.share({ url, title });
        return;
      }

      // Desktop browsers: copy to clipboard
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(url);
        // The 'clipboard' key exists in both locales.
        showToast(i18n.t("clipboard"));
        return;
      }
    } catch {
      // Dismissed or not allowed — fall through to toast
    }

    // Last resort: show the URL in a toast
    showToast(url);
    return;
  }

  // Native
  try {
    await Share.share({ message: url, title });
  } catch {
    // Dismissed — no-op
  }
}
