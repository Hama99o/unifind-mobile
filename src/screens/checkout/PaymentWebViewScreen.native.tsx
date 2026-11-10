/**
 * PaymentWebViewScreen — NATIVE (iOS/Android) implementation.
 *
 * Renders an in-app WebView for the Whish Money hosted payment page.
 * Intercepts navigation when the URL contains `/find/offerings/checkout/payment-status`,
 * parses `status` + `bookingRef` from query params, closes the view, and
 * router.replace to PaymentStatusScreen.
 *
 * react-native-webview is imported directly here — this file is NEVER bundled
 * for web. Metro's platform resolution ensures only the .web.tsx variant is
 * included in the web bundle.
 */

import { useRef, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { Button } from "@/components/ui/button";
import { classifyPaymentRedirect, type PaymentRedirect } from "@/screens/checkout/paymentRedirect";

export interface PaymentWebViewScreenProps {
  collectUrl: string;
  bookingReference: string;
  onClose: () => void;
}

function navigateToPaymentStatus(redirect: PaymentRedirect) {
  router.replace({
    pathname: "/(main)/offerings/checkout/payment-status" as never,
    params: {
      status: redirect.status,
      bookingRef: redirect.bookingRef,
      ...(redirect.message ? { message: redirect.message } : {}),
    },
  });
}

export function PaymentWebViewScreen({
  collectUrl,
  bookingReference,
  onClose,
}: PaymentWebViewScreenProps) {
  const colors = useColors();
  const { t } = useCustomTranslation();

  /**
   * Both onNavigationStateChange and onShouldStartLoadWithRequest can fire for the
   * same redirect URL. This ref ensures we navigate to payment-status only once.
   */
  const navigatedRef = useRef(false);

  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  /** Returns true when the URL was a backend redirect we handled in-app. */
  const intercept = (url: string): boolean => {
    const redirect = classifyPaymentRedirect(url, bookingReference);
    if (!redirect) return false;
    if (!navigatedRef.current) {
      navigatedRef.current = true;
      navigateToPaymentStatus(redirect);
    }
    return true;
  };

  const handleNavigationStateChange = (state: { url: string }) => {
    if (state.url) intercept(state.url);
  };

  const handleShouldStartLoad = (request: { url: string }): boolean => !intercept(request.url);

  if (loadError) {
    return (
      <View
        testID="payment-webview-error"
        style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12, backgroundColor: colors.background }}
      >
        <Text className="text-base font-semibold text-foreground text-center">{t("paymentPageLoadError")}</Text>
        <Button
          label={t("common.retry")}
          onPress={() => {
            setLoadError(false);
            setAttempt((n) => n + 1);
          }}
        />
        <Button label={t("common.close")} variant="outline" onPress={onClose} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <WebView
        key={attempt}
        source={{ uri: collectUrl }}
        onError={() => setLoadError(true)}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        startInLoadingState
        renderLoading={() => (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.background,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted-foreground text-sm mt-3">
              {t("common.loading")}
            </Text>
          </View>
        )}
        style={{ flex: 1 }}
      />
    </View>
  );
}
