/**
 * app/auth/callback.tsx — Native Auth0 callback route.
 *
 * On iOS/Android, after Auth0 redirects to unifind://auth/callback the OS
 * brings the app back to the foreground and expo-router resolves this route.
 * expo-web-browser's openAuthSessionAsync() intercepts the deep link
 * internally (on iOS via SFSafariViewController, on Android via Custom Tabs)
 * before this route is ever rendered, so the screen is a no-op in practice.
 *
 * On Android it DOES render (Custom Tabs hands the deep link to the router).
 * It shows a brief spinner, then returns to the screen the user signed in
 * from (offering, favorites, compare…); Home only when there is no history.
 *
 * Platform: iOS + Android. The web equivalent is app/auth/callback.web.tsx.
 */

import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { Logo } from "@/components/shared/Logo";
import { lightColors } from "@/config/theme";

export default function AuthCallbackNative() {
  const router = useRouter();
  const { t } = useCustomTranslation();

  useEffect(() => {
    // The code exchange is done by promptAsync; this route only has to get out
    // of the way. Going back keeps the user where they were (QA 2026-11-10:
    // always replacing to Home lost their place after every sign-in).
    const timeout = setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace("/(main)/(tabs)/home");
    }, 1500);
    return () => clearTimeout(timeout);
  }, [router]);

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
