/**
 * OfferingAvailabilityCard — the date-picker + time-slot grid + price + book button
 * sub-section, rendered inside OfferingSpecialistSection when a specialist is selected.
 *
 * RTL-safe. No hardcoded hex. Gluestack only.
 */

import { View, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { OfferingDayCard } from "@/screens/offering/OfferingDayCard";
import { OfferingTimeSlot } from "@/screens/offering/OfferingTimeSlot";
import { OfferingPriceDisplay } from "@/screens/offering/OfferingPriceDisplay";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import type { AvailabilityDate, AvailabilityPrice, TimeSlot } from "@/api/availabilityApi";

interface OfferingAvailabilityCardProps {
  dates: AvailabilityDate[];
  datesLoading: boolean;
  selectedDateIndex: number | null;
  onSelectDate: (idx: number) => void;
  timeSlots: TimeSlot[];
  timesLoading: boolean;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  price: AvailabilityPrice | null;
  booking: boolean;
  onBook: () => void;
}

export function OfferingAvailabilityCard({
  dates,
  datesLoading,
  selectedDateIndex,
  onSelectDate,
  timeSlots,
  timesLoading,
  selectedSlot,
  onSelectSlot,
  price,
  booking,
  onBook,
}: OfferingAvailabilityCardProps) {
  const { t, isRtl } = useCustomTranslation();

  const selectedDate = selectedDateIndex !== null ? dates[selectedDateIndex] : null;
  const availableSlots = timeSlots.filter((s) => !s.fullyBooked);

  if (datesLoading) {
    return (
      <View className="bg-card rounded-2xl border border-border p-4 gap-4">
        <Skeleton className="h-5 w-40 rounded-lg bg-muted" />
        <View className="flex-row gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="rounded-xl bg-muted" style={{ width: 72, height: 80 }} />
          ))}
        </View>
      </View>
    );
  }

  if (dates.length === 0) {
    return <EmptyState title={t("dateTimeEmpty")} />;
  }

  return (
    <View className="bg-card rounded-2xl border border-border p-4 gap-4">
      {/* Available sessions heading */}
      <View className={`flex-row items-baseline gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        <Heading size="md" className="text-foreground">
          {t("availableSessions")}
        </Heading>
        <Text className="text-xs text-muted-foreground">({t("lebanonTime")})</Text>
      </View>

      {/* Day picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className={`flex-row ${isRtl ? "flex-row-reverse" : ""}`}>
          {dates.map((d, idx) => (
            <OfferingDayCard
              key={d.date}
              item={d}
              selected={idx === selectedDateIndex}
              onPress={() => onSelectDate(idx)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Time slots */}
      {selectedDate && (
        <View>
          <Text className={`text-sm font-semibold text-foreground mb-2 ${isRtl ? "text-right" : ""}`}>
            {t("availableSlots")}
          </Text>
          {timesLoading ? (
            <View className={`flex-row flex-wrap gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="rounded-xl bg-muted" style={{ width: 80, height: 40 }} />
              ))}
            </View>
          ) : availableSlots.length === 0 ? (
            <EmptyState title={t("slotsEmpty")} />
          ) : (
            <View className={`flex-row flex-wrap ${isRtl ? "flex-row-reverse" : ""}`}>
              {timeSlots.map((slot, i) => (
                <OfferingTimeSlot
                  key={`${slot.start}-${i}`}
                  slot={slot}
                  selected={selectedSlot === slot}
                  onPress={() => onSelectSlot(slot)}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Price + Book button */}
      {price && (
        <View>
          <Divider className="my-2" />
          <OfferingPriceDisplay price={price} />
          <Button
            label={booking ? t("common.loading") : t("bookASession")}
            action="primary"
            variant="solid"
            onPress={onBook}
            disabled={booking}
            className="w-full"
          />
        </View>
      )}
    </View>
  );
}
