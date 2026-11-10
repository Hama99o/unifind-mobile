/**
 * OfferingCheckoutScreen — full checkout screen for a paid offering booking.
 * Route param: id = bookingReference (e.g. "UF-2025-00001").
 *
 * Web parity:
 *   - Auth-gated (whole screen; shows SignInSheet if logged out).
 *   - On mount: getPaymentStatus first — if "paid" → show already-paid state.
 *   - Loads booking via getById(bookingReference) → flat checkout shape.
 *   - Fetches offering image from Strapi by offeringContentId.
 *   - Session summary card (BookingSessionCard reuse, no meeting link).
 *   - Notes textarea (sent as `notes` on Pay).
 *   - Promo code block (PromoBlock).
 *   - Price breakdown (PriceBreakdown).
 *   - Payment method tabs: Whish (active) | Card (Soon, disabled).
 *   - Pay Now → paymentApi.getWhishUrl → opens in-app WebView (Modal).
 *   - Loading skeleton, error state, already-paid guard.
 *
 * §2 changes:
 *   - mb-1 below breadcrumb, mt-1 above session summary.
 *   - already-paid state → EmptyState-pattern (CheckCircle, colors.secondary) §S4.
 *   - brand import removed; GradientView uses colors.primary + colors.secondary tokens.
 *
 * Split files (all < 300 lines each):
 *   CheckoutSessionSummary.tsx  — session card adapter (BookingSessionCard reuse)
 *   PromoBlock.tsx              — promo input + active banner + remove
 *   PriceBreakdown.tsx          — subtotal / discount / total
 *   PaymentWebViewScreen.tsx    — in-app Whish WebView with URL interception
 *   PaymentWebViewModal.tsx     — full-screen Modal shell around PaymentWebViewScreen
 */

import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { CheckCircle } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { AppHeader } from "@/components/shared/AppHeader";
import { GradientView } from "@/components/shared/GradientView";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { useSignInSheet } from "@/auth/useSignInSheet";
import { showToast } from "@/stores/toastStore";
import { bookingsApi, type CheckoutBooking } from "@/api/bookingsApi";
import { paymentApi } from "@/api/paymentApi";
import type { AppliedPromo } from "@/api/promoCodeApi";
import { CheckoutSessionSummary } from "@/screens/checkout/CheckoutSessionSummary";
import { CheckoutSkeleton } from "@/screens/checkout/CheckoutSkeleton";
import { PromoBlock } from "@/screens/checkout/PromoBlock";
import { PriceBreakdown } from "@/screens/checkout/PriceBreakdown";
import { PaymentMethodTabs } from "@/screens/checkout/PaymentMethodTabs";
import { PaymentWebViewModal } from "@/screens/checkout/PaymentWebViewModal";
import { PAYMENTS_ENABLED } from "@/config/payments";
import { PaymentsUnavailableNotice } from "@/components/shared/PaymentsUnavailableNotice";

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function OfferingCheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useCustomTranslation();
  const colors = useColors();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { open: openSignIn } = useSignInSheet();

  const [booking, setBooking] = useState<CheckoutBooking | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [notes, setNotes] = useState("");
  const [localPromo, setLocalPromo] = useState<AppliedPromo | null>(null);
  const [overrideFinalPrice, setOverrideFinalPrice] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [collectUrl, setCollectUrl] = useState<string | null>(null);

  // Auth gate: if not logged in, show SignInSheet
  useEffect(() => {
    if (!isLoggedIn) {
      openSignIn();
    }
  }, [isLoggedIn]);

  const bookingRef = Array.isArray(id) ? id[0] : id ?? "";

  const load = async () => {
    if (!bookingRef) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Check payment status first — guard against re-paying
      const payStatus = await bookingsApi.getPaymentStatus(bookingRef);
      if (payStatus === "paid") {
        setAlreadyPaid(true);
        setLoading(false);
        return;
      }
      // 2. Fetch flat checkout booking shape
      const data = await bookingsApi.getById(bookingRef);
      setBooking(data);
      // 3. Fetch offering image from Strapi if offeringContentId present
      if (data.offeringId?.offeringContentId) {
        const img = await bookingsApi.getOfferingImageUrl(
          data.offeringId.offeringContentId
        );
        setImageUrl(img);
      }
    } catch {
      setError(t("profileLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [bookingRef]);

  const handlePay = async () => {
    if (!bookingRef || !PAYMENTS_ENABLED) return;
    setPaying(true);
    try {
      const url = await paymentApi.getWhishUrl(bookingRef, notes);
      setCollectUrl(url);
    } catch (err: unknown) {
      const msg =
        (
          err as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ??
        (err as { message?: string })?.message ??
        t("paymentInitError");
      showToast(msg);
    } finally {
      setPaying(false);
    }
  };

  const handleWebViewClose = () => {
    setCollectUrl(null);
    // Reconcile payment status on user dismissal
    bookingsApi.getPaymentStatus(bookingRef).then((s) => {
      if (s === "paid") setAlreadyPaid(true);
    });
  };

  // ─── Render states ────────────────────────────────────────────────────────────

  if (!isLoggedIn) {
    return (
      <ScreenContainer>
        <AppHeader title={t("checkoutTitle")} showBack />
        <EmptyState
          title={t("signInRequired")}
          description={t("signInDescription")}
        />
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer>
        <AppHeader title={t("check_out_summary")} showBack />
        <CheckoutSkeleton />
      </ScreenContainer>
    );
  }

  // §S4 — already-paid state: EmptyState-pattern with CheckCircle + colors.secondary
  if (alreadyPaid) {
    return (
      <ScreenContainer>
        <AppHeader title={t("checkoutTitle")} showBack />
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <CheckCircle size={72} color={colors.secondary} strokeWidth={1.5} />
          <Heading size="md" className="text-foreground text-center">
            {t("alreadyPaid")}
          </Heading>
          <Text className="text-muted-foreground text-center text-sm">
            {t("alreadyPaidDesc")}
          </Text>
          <Button
            label={t("goToBookings")}
            action="primary"
            onPress={() => router.replace("/(main)/(tabs)/profile" as never)}
          />
        </View>
      </ScreenContainer>
    );
  }

  if (error || !booking) {
    return (
      <ScreenContainer>
        <AppHeader title={t("check_out_summary")} showBack />
        <View className="flex-1 items-center justify-center gap-4 p-8">
          <Text className="text-destructive text-center">
            {error ?? t("notFound")}
          </Text>
          <Button label={t("common.retry")} onPress={load} action="primary" />
        </View>
      </ScreenContainer>
    );
  }

  // ─── Main checkout UI (with WebView modal layered on top) ─────────────────────

  return (
    <ScreenContainer>
      <AppHeader title={t("check_out_summary")} showBack />

      {/* In-app Whish WebView — full-screen modal; extracted to keep this file <300 lines */}
      <PaymentWebViewModal
        collectUrl={collectUrl}
        bookingReference={bookingRef}
        onClose={handleWebViewClose}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Breadcrumb — §2: mb-1 below */}
        <Text className="text-xs text-muted-foreground mb-1">
          {t("home")} › {t("offering")} › {t("checkout")}
        </Text>

        {/* Session summary — §2: mt-1 above */}
        <View className="mt-1">
          <CheckoutSessionSummary booking={booking} imageUrl={imageUrl} />
        </View>

        {/* Notes textarea */}
        <View className="bg-card rounded-2xl border border-border p-4 gap-2">
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText className="text-sm font-semibold text-foreground">
                {t("questions_booking")}
              </FormControlLabelText>
            </FormControlLabel>
            <Textarea>
              <TextareaInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t("question")}
                numberOfLines={4}
              />
            </Textarea>
          </FormControl>
        </View>

        {/* Promo code block — bookingRef from route params (getById may not include it) */}
        <PromoBlock
          booking={booking}
          bookingRef={bookingRef}
          localPromo={localPromo}
          onPromoApplied={(promo) => {
            setLocalPromo(promo);
            setOverrideFinalPrice(null);
          }}
          onPromoRemoved={(newFinalPrice) => {
            setLocalPromo(null);
            setOverrideFinalPrice(newFinalPrice);
            setBooking((prev) =>
              prev
                ? {
                    ...prev,
                    appliedPromoCode: null,
                    pricing: { ...prev.pricing, discountAmount: 0 },
                    finalPrice: newFinalPrice,
                  }
                : prev
            );
          }}
        />

        {/* Price breakdown */}
        <PriceBreakdown
          booking={booking}
          localPromo={localPromo}
          overrideFinalPrice={overrideFinalPrice}
        />

        {/* Payment method + Pay Now */}
        <View className="bg-card rounded-2xl border border-border p-4 gap-4">
          {PAYMENTS_ENABLED ? (
            <>
              <PaymentMethodTabs selected="whish" />

              <GradientView
                colors={[colors.primary, colors.secondary]}
                style={{ borderRadius: 14 }}
              >
                <Button
                  label={t("pay_now")}
                  onPress={handlePay}
                  disabled={paying}
                  variant="solid"
                  className="bg-transparent w-full"
                  testID="checkout-pay-now"
                />
              </GradientView>
            </>
          ) : (
            <PaymentsUnavailableNotice />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
