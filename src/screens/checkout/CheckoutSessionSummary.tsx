/**
 * CheckoutSessionSummary — booking session card for the checkout screen.
 * Reuses BookingSessionCard from booking/ screens (no meeting link shown).
 * Shows offering image, title, price (original/discounted), specialist,
 * time (Beirut TZ), mode, duration.
 */

import { View } from "react-native";
import { BookingSessionCard } from "@/screens/booking/BookingSessionCard";
import type { SessionData } from "@/screens/booking/BookingSessionCard";
import type { CheckoutBooking } from "@/api/bookingsApi";

interface CheckoutSessionSummaryProps {
  booking: CheckoutBooking;
  imageUrl: string;
}

export function CheckoutSessionSummary({
  booking,
  imageUrl,
}: CheckoutSessionSummaryProps) {
  const evt = booking.eventTypeId;

  // Show the discounted price if it is non-zero and different from basePrice.
  const hasDiscount =
    evt.discountedPrice > 0 && evt.discountedPrice !== evt.basePrice;

  const sessionData: SessionData = {
    title: booking.offeringId?.title ?? "",
    imageUrl: imageUrl || undefined,
    // No meeting link in checkout mode
    meetingLink: undefined,
    originalPrice: String(evt.basePrice ?? 0),
    discountedPrice: hasDiscount ? String(evt.discountedPrice) : "0",
    currency: booking.currency?.symbol ?? "$",
    specialist: booking.specialistId?.name ?? "",
    date: booking.date ?? "",
    startTime: booking.startTime ?? "",
    endTime: booking.endTime ?? "",
    sessionType: evt.mode ?? "",
    duration: `${evt.durationMinutes ?? 0} min`,
  };

  return (
    <View>
      <BookingSessionCard session={sessionData} />
    </View>
  );
}
