/**
 * app/auth/callback.tsx — Native Auth0 callback route.
 *
 * On iOS/Android, after Auth0 redirects to unifind://auth/callback the OS
 * brings the app back to the foreground and expo-router resolves this route.
 * expo-web-browser's openAuthSessionAsync() intercepts the deep link
 * internally (on iOS via SFSafariViewController, on Android via Custom Tabs)
 * before this route is ever rendered, so the screen is a no-op in practice.
 *
 * It renders a brief spinner in case the user navigates here manually or the
 * deep-link interception is delayed, then redirects home.
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
    // Redirect home — on native the in-app browser handles the code exchange
    // before this route is rendered. This is a safety fallback only.
    const timeout = setTimeout(() => {
      router.replace("/(main)/(tabs)/home");
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
