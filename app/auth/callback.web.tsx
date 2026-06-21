/**
 * app/auth/callback.web.tsx — Web-only Auth0 callback page.
 *
 * This route is loaded inside the popup window that Auth0 redirects to
 * after the user authenticates. It must NOT navigate away — instead it
 * calls WebBrowser.maybeCompleteAuthSession() which posts the auth result
 * back to the opener window (the main app tab) and then closes the popup.
 *
 * The popup URL must remain stable (same origin, same path) throughout
 * the auth flow. If this page redirected to "/" or triggered a tab change,
 * the popup would lose the callback URL and expo-web-browser's state check
 * would fail ("No auth session is currently in progress").
 *
 * Auth0 dashboard: add http://localhost:3010/auth/callback to Allowed Callback URLs.
 *
 * Platform: WEB ONLY. The native equivalent is app/auth/callback.tsx.
 */

import { useEffect } from "react";
import { View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { Logo } from "@/components/shared/Logo";
import { lightColors } from "@/config/theme";

export default function AuthCallbackWeb() {
  const { t } = useCustomTranslation();

  useEffect(() => {
    // Hand the auth code back to the opener and close this popup.
    // This must run on mount — before any render or navigation occurs.
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  // Render a centered spinner so the popup is not blank while it self-closes.
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        backgroundColor: lightColors.background,
      }}
    >
      <Logo variant="prussian" height={36} style={{ marginBottom: 8 }} />
      <Spinner size="large" />
      <Text className="text-sm text-muted-foreground">{t("signingIn")}</Text>
    </View>
  );
}
