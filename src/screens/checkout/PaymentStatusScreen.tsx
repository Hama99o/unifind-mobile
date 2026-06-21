/**
 * PaymentStatusScreen — shown after the Whish payment completes.
 *
 * Route params:
 *   status     — "success" | "failed" (or any non-success = failed)
 *   bookingRef — the bookingReference string (to retry on failure)
 *
 * §2 changes:
 *   - Success CheckCircle → colors.secondary (turquoise, celebratory).
 *   - The <Heading> that repeated the AppHeader title is dropped.
 *     Instead: t('paymentSuccessCongrats') at size "lg" + the message below.
 *   - Failure path stays colors.destructive.
 *
 * Web parity:
 *   - Success: turquoise circle-check icon, congratulatory text, message, "Go To Bookings".
 *   - Failure: red circle-xmark, "Payment Failed", message, "Try To Pay" → checkout retry.
 *   - Both fully translated in en + ar.
 */

import { View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { CheckCircle, XCircle } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { AppHeader } from "@/components/shared/AppHeader";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";

export default function PaymentStatusScreen() {
  const { status, bookingRef } = useLocalSearchParams<{
    status: string;
    bookingRef: string;
  }>();
  const { t } = useCustomTranslation();
  const colors = useColors();

  const isSuccess = status === "success";

  const handleAction = () => {
    if (isSuccess) {
      // Navigate to the Profile bookings tab
      router.replace("/(main)/(tabs)/profile" as never);
    } else {
      // Retry: go back to checkout with the same bookingRef
      if (bookingRef) {
        router.replace({
          pathname: "/(main)/offerings/checkout/[id]" as never,
          params: { id: bookingRef },
        });
      } else {
        router.back();
      }
    }
  };

  return (
    <ScreenContainer>
      <AppHeader title={isSuccess ? t("paymentSuccessTitle") : t("paymentFailedTitle")} />
      <View className="flex-1 items-center justify-center px-8 gap-6">
        {/* Icon — §2: success uses colors.secondary (turquoise), failure uses destructive */}
        {isSuccess ? (
          <CheckCircle size={96} color={colors.secondary} strokeWidth={1.5} />
        ) : (
          <XCircle size={96} color={colors.destructive} strokeWidth={1.5} />
        )}

        {/* §2: success — congratulatory sub-heading (not the AppHeader title repeat) */}
        {isSuccess ? (
          <Heading size="lg" className="text-center text-foreground">
            {t("paymentSuccessCongrats")}
          </Heading>
        ) : (
          <Heading
            size="xl"
            className="text-center"
            style={{ color: colors.destructive }}
          >
            {t("paymentFailedTitle")}
          </Heading>
        )}

        {/* Message */}
        <Text className="text-center text-foreground text-base">
          {isSuccess ? t("paymentSuccessMessage") : t("paymentFailedMessage")}
        </Text>

        {/* Action button */}
        <Button
          label={isSuccess ? t("goToBookings") : t("tryToPay")}
          action={isSuccess ? "primary" : "destructive"}
          variant="solid"
          onPress={handleAction}
          className="w-full"
        />
      </View>
    </ScreenContainer>
  );
}
