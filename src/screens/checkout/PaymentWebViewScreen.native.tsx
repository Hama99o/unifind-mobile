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

import { useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

const PAYMENT_STATUS_PATH = "/find/offerings/checkout/payment-status";

function parseQueryParams(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    urlObj.searchParams.forEach((v, k) => {
      params[k] = v;
    });
    return params;
  } catch {
    const queryIndex = url.indexOf("?");
    if (queryIndex === -1) return {};
    const query = url.slice(queryIndex + 1);
    const params: Record<string, string> = {};
    query.split("&").forEach((pair) => {
      const [k, v] = pair.split("=");
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
    });
    return params;
  }
}

export interface PaymentWebViewScreenProps {
  collectUrl: string;
  bookingReference: string;
  onClose: () => void;
}

function navigateToPaymentStatus(url: string) {
  const params = parseQueryParams(url);
  const status = params.status ?? "failed";
  const bookingRef = params.bookingRef ?? "";
  router.replace({
    pathname: "/(main)/offerings/checkout/payment-status" as never,
    params: { status, bookingRef },
  });
}

export function PaymentWebViewScreen({
  collectUrl,
}: PaymentWebViewScreenProps) {
  const colors = useColors();
  const { t } = useCustomTranslation();

  /**
   * Both onNavigationStateChange and onShouldStartLoadWithRequest can fire for the
   * same redirect URL. This ref ensures we navigate to payment-status only once.
   */
  const navigatedRef = useRef(false);

  const handleNavigationStateChange = (state: { url: string }) => {
    if (state.url && state.url.includes(PAYMENT_STATUS_PATH)) {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      navigateToPaymentStatus(state.url);
    }
  };

  const handleShouldStartLoad = (request: { url: string }): boolean => {
    if (request.url && request.url.includes(PAYMENT_STATUS_PATH)) {
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        navigateToPaymentStatus(request.url);
      }
      return false;
    }
    return true;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <WebView
        source={{ uri: collectUrl }}
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
