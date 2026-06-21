/**
 * BookingDetailScreen — full booking detail view.
 *
 * Route param: bookingReference (string).
 * GET {Node}/booking/:bookingReference/details → BookingDetailData
 * GET Strapi /api/offerings?filters[id][$eq]=<id>&populate=image → offering image
 *
 * Layout:
 *   - AppHeader with back button
 *   - Booking ID + status pill
 *   - BookingProgressStepper (4 steps)
 *   - BookingSessionCard
 *   - BookingPaymentCard
 *   - Notes (if present)
 *   - BookingReviewSection (ONLY when booking.status === "completed")
 *
 * Loading: content-shaped skeleton (§S3). Error: EmptyState (§S4).
 * Entrance: FadeInDown.duration(280).springify() (§S7).
 */

import { useEffect, useState, useRef } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AlertCircle } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Center } from "@/components/ui/box";
import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { AppHeader } from "@/components/shared/AppHeader";
import { BookingProgressStepper, buildSteps } from "@/screens/booking/BookingProgressStepper";
import { BookingSessionCard, type SessionData } from "@/screens/booking/BookingSessionCard";
import { BookingPaymentCard, type PaymentCardData } from "@/screens/booking/BookingPaymentCard";
import { BookingReviewSection } from "@/screens/booking/BookingReviewSection";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import { useColors } from "@/hooks/useColors";
import { bookingsApi, type BookingDetailData, capitalizeStatus, toPaymentStatus } from "@/api/bookingsApi";
import { StatusPill } from "@/components/shared/StatusPill";

// ─── Skeleton — content-shaped (§S3: ref+pill, stepper, session, payment) ─────

function DetailSkeleton() {
  return (
    <View className="gap-4 p-4">
      {/* Booking ref + status pill */}
      <View className="flex-row items-center gap-3">
        <Skeleton className="h-6 w-40 bg-muted rounded-lg" />
        <Skeleton className="h-6 w-20 bg-muted rounded-full" />
      </View>

      {/* Progress stepper */}
      <View className="bg-card rounded-2xl border border-border p-4">
        <View className="flex-row justify-between items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
              <Skeleton className="w-11 h-11 bg-muted rounded-full" />
              <Skeleton className="h-3 w-14 bg-muted rounded" />
            </View>
          ))}
        </View>
      </View>

      {/* Session card */}
      <Skeleton className="h-44 bg-muted rounded-2xl" />

      {/* Payment card */}
      <Skeleton className="h-52 bg-muted rounded-2xl" />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function BookingDetailScreen() {
  const { bookingReference } = useLocalSearchParams<{ bookingReference: string }>();
  const { t } = useCustomTranslation();
  const { formatDate, formatCurrency } = useLocalization();
  const colors = useColors();

  /** Map currency symbol to ISO code for formatCurrency */
  const symbolToCode = (symbol: string): "USD" | "LBP" => {
    if (symbol === "ل.ل" || symbol === "LBP") return "LBP";
    return "USD";
  };

  const [bookingData, setBookingData] = useState<BookingDetailData | null>(null);
  const [offeringImageUrl, setOfferingImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reviewRef = useRef<ScrollView>(null);

  const load = async () => {
    if (!bookingReference) return;
    setLoading(true);
    setError(null);
    try {
      const data = await bookingsApi.getDetails(bookingReference);
      setBookingData(data);

      if (data.offering?.offeringContentId) {
        const imgUrl = await bookingsApi.getOfferingImageUrl(data.offering.offeringContentId);
        setOfferingImageUrl(imgUrl);
      }
    } catch {
      setError(t("profileLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [bookingReference]);

  if (loading) {
    return (
      <ScreenContainer>
        <AppHeader title={t("bookingDetail.title")} showBack />
        <DetailSkeleton />
      </ScreenContainer>
    );
  }

  // §S4 — error state: icon + title + retry action (EmptyState visual pattern)
  if (error || !bookingData) {
    return (
      <ScreenContainer>
        <AppHeader title={t("bookingDetail.title")} showBack />
        <Center className="flex-1 gap-3 px-8 py-16">
          <AlertCircle size={48} color={colors.destructive} />
          <Heading size="md" className="text-center text-foreground">
            {error ?? t("bookingDetail.notFound")}
          </Heading>
          <Button label={t("common.retry")} onPress={load} action="primary" />
        </Center>
      </ScreenContainer>
    );
  }

  const safeStatus = capitalizeStatus(bookingData.booking.status);
  const paymentStatus = toPaymentStatus(bookingData.booking.paymentStatus);
  // §2 buildSteps now takes t() for i18n labels
  const steps = buildSteps(safeStatus, t);

  const currencyCode = symbolToCode(bookingData.pricing.currency.symbol);
  const fmt = (v: number) => formatCurrency(v, currencyCode);

  const sessionData: SessionData = {
    title: bookingData.offering.title,
    imageUrl: offeringImageUrl || undefined,
    meetingLink: bookingData.session?.meetingLink && bookingData.session.meetingLink !== "#"
      ? bookingData.session.meetingLink
      : undefined,
    originalPrice: String(bookingData.pricing.originalPrice),
    discountedPrice: String(bookingData.pricing.discountPrice),
    currency: bookingData.pricing.currency.symbol,
    specialist: bookingData.specialist.name,
    date: bookingData.booking.date,
    startTime: bookingData.booking.start,
    endTime: bookingData.booking.end,
    sessionType: bookingData.eventType.mode,
    duration: `${bookingData.offering.duration} ${t("min")}`,
  };

  const paymentData: PaymentCardData = {
    method: "Whish Money",
    status: paymentStatus,
    promocode: String(bookingData.pricing.appliedPromoCode),
    promoCodeName: bookingData.pricing.promoCode,
    price: fmt(bookingData.pricing.originalPrice),
    discountedPriceEvent: fmt(bookingData.pricing.discountPrice),
    priceAfterPromoCode: fmt(bookingData.pricing.finalPrice),
    bookingReference: bookingReference ?? "",
  };

  const isCompleted = safeStatus.toLowerCase() === "completed";

  return (
    <ScreenContainer>
      <AppHeader title={t("bookingDetail.title")} showBack />
      {/* §S7 — content root entrance animation */}
      <Animated.View
        entering={FadeInDown.duration(280).springify()}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 16 }}
          ref={reviewRef}
        >
          {/* Header: booking ref + status */}
          <View className="flex-row items-center gap-3 flex-wrap">
            <Heading size="md" className="text-foreground">
              {t("bookingDetail.booking")} {bookingReference}
            </Heading>
            <StatusPill status={safeStatus} />
          </View>

          {/* Progress stepper */}
          <View className="bg-card rounded-2xl border border-border p-4">
            <BookingProgressStepper steps={steps} />
          </View>

          {/* Session card */}
          <BookingSessionCard session={sessionData} />

          {/* Payment card */}
          <BookingPaymentCard data={paymentData} />

          {/* Notes */}
          {bookingData.notes ? (
            <View className="bg-card rounded-2xl border border-border p-4 gap-2">
              <Text className="text-sm font-semibold text-foreground">{t("bookingDetail.notes")}</Text>
              <Text className="text-sm text-muted-foreground">{bookingData.notes}</Text>
            </View>
          ) : null}

          {/* Review section — only for completed */}
          {isCompleted && (
            <View nativeID="offeringReviewsID">
              <Heading size="sm" className="text-foreground mb-3">{t("reviews")}</Heading>
              <BookingReviewSection
                offeringContentId={bookingData.offering.offeringContentId}
                specialistName={bookingData.specialist.name}
                eventTypeMode={bookingData.eventType.mode}
              />
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </ScreenContainer>
  );
}
