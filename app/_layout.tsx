// Installed before any other import so it's armed before anything can throw.
import { installCrashReporter, onCrash } from "@/utils/crashReporter";
installCrashReporter();

// Relative path (NOT the @/ alias) so NativeWind's Metro transformer reliably
// matches this import against its configured input ("./src/styles/global.css")
// and injects the compiled styles on native. Mirrors the working Hatiwal app.
import "../src/styles/global.css";
import "@/i18n";
import { restoreAppLanguage } from "@/i18n/language";
// Apply the saved language as early as possible (resolves while the splash shows).
void restoreAppLanguage();
// Import authService early so it registers its refresh fn in authStore + nodeApi
import "@/services/authService";

import { useEffect, useState } from "react";
import { CrashScreen } from "@/components/shared/CrashScreen";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/stores/authStore";
import { lightColors } from "@/config/theme";
import { ToastHost } from "@/components/shared/ToastHost";
import { AlertDialogHost } from "@/components/shared/AlertDialogHost";
import { SignInSheetHost } from "@/auth/SignInSheetHost";
import { useTokenForegroundRefresh } from "@/auth/useTokenForegroundRefresh";
import { Spinner } from "@/components/ui/spinner";
import { Logo } from "@/components/shared/Logo";

const queryClient = new QueryClient();

function AppServices() {
  useTokenForegroundRefresh();
  return null;
}

/**
 * Bootstrap splash overlay.
 *
 * Renders an opaque layer with a centered spinner while
 * authStore.isBootstrapping is true (token hydration + optional silent
 * refresh is in progress). This prevents a signed-in user from ever
 * seeing the logged-out profile state before the session is restored.
 *
 * When isBootstrapping flips to false, the overlay fades out over 200ms
 * (withTiming) then unmounts via runOnJS — avoiding a flash while keeping
 * the navigator always mounted and expo-router resolving routes normally.
 */
function BootstrapOverlay() {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const [mounted, setMounted] = useState(true);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    if (!isBootstrapping && mounted) {
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [isBootstrapping]);

  if (!mounted) return null;

  return (
    <Animated.View style={[styles.overlay, animStyle]} pointerEvents="box-none">
      <Logo variant="prussian" height={36} style={{ marginBottom: 24 }} />
      <Spinner size="large" />
    </Animated.View>
  );
}

export default function RootLayout() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    onCrash((error, isFatal) => {
      if (isFatal) setFatalError(error);
    });
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (fatalError) return <CrashScreen error={fatalError} />;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(main)" />
              <Stack.Screen name="auth/callback" />
            </Stack>
            {/* Bootstrap splash: blocks interaction while session hydrates */}
            <BootstrapOverlay />
            {/* Global overlays — mounted once, accessible from anywhere */}
            <ToastHost />
            <AlertDialogHost />
            <SignInSheetHost />
            <AppServices />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: lightColors.background,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
});
