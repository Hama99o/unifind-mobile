/**
 * PaymentWebViewScreen — WEB implementation.
 *
 * On web there is no in-app WebView. Instead, open the Whish payment page
 * in a new browser tab via Linking.openURL, then call onClose so the user
 * returns to the checkout screen. The payment status will be reconciled by
 * the caller (OfferingCheckoutScreen polls getPaymentStatus on close).
 *
 * react-native-webview is NEVER imported here. Metro ensures this file is
 * only bundled for the web target.
 */

import { useEffect } from "react";
import { Linking } from "react-native";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { Text } from "@/components/ui/text";

export interface PaymentWebViewScreenProps {
  collectUrl: string;
  bookingReference: string;
  onClose: () => void;
}

export function PaymentWebViewScreen({
  collectUrl,
  onClose,
}: PaymentWebViewScreenProps) {
  const { t } = useCustomTranslation();

  useEffect(() => {
    if (collectUrl) {
      Linking.openURL(collectUrl).catch(() => {});
      // Return user to checkout UI immediately; payment completes in a new tab.
      onClose();
    }
  }, [collectUrl]);

  // Render a brief transitional message while the browser tab opens.
  return (
    <Text className="text-muted-foreground text-sm text-center p-4">
      {t("common.loading")}
    </Text>
  );
}
