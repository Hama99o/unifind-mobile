/**
 * OfferingSpecialistSection — THE booking flow section.
 *
 * Flow: mode tabs → specialist list → availability card (dates/times/price/book).
 *
 * Race-condition guard: each cascading fetch (specialists / dates / times) captures
 * a monotonically-incrementing sequence token at call-start; on resolve the result
 * is discarded if the token is stale. Rapid taps never mix stale eventTypeId/price.
 *
 * Auth-gated: selecting a specialist and toggling specialist favorites require login.
 * Sub-components extracted to sibling files — OfferingDayCard, OfferingTimeSlot,
 * OfferingPriceDisplay, OfferingAvailabilityCard — to keep each file < 300 lines.
 * RTL-safe. No hardcoded hex. Gluestack only.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { EmptyState } from "@/components/shared/EmptyState";
import { SpecialistCard } from "@/components/cards/SpecialistCard";
import { OfferingAvailabilityCard } from "@/screens/offering/OfferingAvailabilityCard";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { useAuthGate } from "@/auth/useAuthGate";
import { useSelection } from "@/hooks/useSelection";
import { nodeOfferingApi } from "@/api/nodeOfferingApi";
import { availabilityApi } from "@/api/availabilityApi";
import { bookingsApi } from "@/api/bookingsApi";
import { showToast } from "@/stores/toastStore";
import type { NodeOfferingDetail, NodeOfferingSpecialist, NodeOfferingEventType } from "@/api/nodeOfferingApi";
import type { AvailabilityDate, AvailabilityPrice, TimeSlot } from "@/api/availabilityApi";
import { getModeLabel, sortByMode } from "@/config/offeringModes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfferingSpecialistSectionProps {
  nodeOffering: NodeOfferingDetail;
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function OfferingSpecialistSection({ nodeOffering }: OfferingSpecialistSectionProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const { requireAuth, isLoggedIn } = useAuthGate();
  const { isFavorite, toggleFavorite } = useSelection();

  // Sequence tokens — newest call wins; stale responses are discarded
  const specialistsSeq = useRef(0);
  const datesSeq = useRef(0);
  const timesSeq = useRef(0);

  // M4 fix: use canonical sortByMode from offeringModes.ts
  const sortedModes: NodeOfferingEventType[] = sortByMode(nodeOffering.eventTypes ?? []);

  const [selectedMode, setSelectedMode] = useState<string>(sortedModes[0]?.mode ?? "");
  const [specialists, setSpecialists] = useState<NodeOfferingSpecialist[]>([]);
  const [specialistsLoading, setSpecialistsLoading] = useState(false);
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string | null>(null);
  const [dates, setDates] = useState<AvailabilityDate[]>([]);
  const [price, setPrice] = useState<AvailabilityPrice | null>(null);
  const [eventTypeId, setEventTypeId] = useState<string>("");
  const [datesLoading, setDatesLoading] = useState(false);
  const [selectedDateIndex, setSelectedDateIndex] = useState<number | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [timesLoading, setTimesLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [booking, setBooking] = useState(false);

  // ── Fetch specialists ──────────────────────────────────────────────────────
  const fetchSpecialists = useCallback(async (mode: string) => {
    const token = ++specialistsSeq.current;
    setSpecialistsLoading(true);
    setSpecialists([]);
    setSelectedSpecialistId(null);
    setDates([]);
    setPrice(null);
    setSelectedDateIndex(null);
    setTimeSlots([]);
    setSelectedSlot(null);
    try {
      const result = await nodeOfferingApi.getSpecialists(nodeOffering._id, mode);
      if (token !== specialistsSeq.current) return;
      setSpecialists(result);
    } finally {
      if (token === specialistsSeq.current) setSpecialistsLoading(false);
    }
  }, [nodeOffering._id]);

  useEffect(() => {
    if (selectedMode) fetchSpecialists(selectedMode);
  }, [selectedMode, fetchSpecialists]);

  // ── Fetch dates ────────────────────────────────────────────────────────────
  const fetchDates = useCallback(async (specialistId: string, mode: string) => {
    const token = ++datesSeq.current;
    setDatesLoading(true);
    setDates([]);
    setPrice(null);
    setEventTypeId("");
    setSelectedDateIndex(null);
    setTimeSlots([]);
    setSelectedSlot(null);
    try {
      const result = await availabilityApi.getDates(nodeOffering._id, specialistId, mode);
      if (token !== datesSeq.current) return;
      if (result) {
        setDates(result.data ?? []);
        setPrice(result.price);
        setEventTypeId(result.eventTypeId);
      }
    } finally {
      if (token === datesSeq.current) setDatesLoading(false);
    }
  }, [nodeOffering._id]);

  // ── Fetch time slots ───────────────────────────────────────────────────────
  const fetchSlots = useCallback(async (dateStr: string, spId: string, mode: string) => {
    const token = ++timesSeq.current;
    setTimesLoading(true);
    setTimeSlots([]);
    setSelectedSlot(null);
    try {
      const result = await availabilityApi.getTimes(nodeOffering._id, spId, mode, dateStr);
      if (token !== timesSeq.current) return;
      setTimeSlots(result);
    } finally {
      if (token === timesSeq.current) setTimesLoading(false);
    }
  }, [nodeOffering._id]);

  useEffect(() => {
    if (selectedDateIndex !== null && dates[selectedDateIndex] && selectedSpecialistId) {
      fetchSlots(dates[selectedDateIndex].date, selectedSpecialistId, selectedMode);
    }
  }, [selectedDateIndex, fetchSlots, dates, selectedSpecialistId, selectedMode]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSpecialistSelect = (id: string) => {
    requireAuth(() => {
      setSelectedSpecialistId(id);
      setSelectedDateIndex(null);
      setTimeSlots([]);
      setSelectedSlot(null);
      fetchDates(id, selectedMode);
    });
  };

  // H1 fix: use canonical toggleFavorite from useSelection (handles auth gate,
  // optimistic update, rollback, and toast internally)
  const handleSpecialistFavorite = (spId: string) => {
    toggleFavorite("Specialist", spId);
  };

  const handleBookSession = () => {
    requireAuth(async () => {
      if (!selectedSpecialistId) { showToast(t("selectSpecialistFirst")); return; }
      if (selectedDateIndex === null || !dates[selectedDateIndex]) { showToast(t("selectDateFirst")); return; }
      if (!selectedSlot) { showToast(t("selectTimeFirst")); return; }
      setBooking(true);
      try {
        const result = await bookingsApi.create({
          offeringId: nodeOffering._id,
          specialistId: selectedSpecialistId,
          eventTypeId,
          date: dates[selectedDateIndex].date,
          start: selectedSlot.start,
          end: selectedSlot.end,
          priceAtBooking: price?.finalPrice ?? 0,
          currency: price?.currency ?? "USD",
        });
        router.push(`/(main)/offerings/checkout/${result.bookingReference}` as never);
      } catch (err) {
        showToast(err instanceof Error ? err.message : t("error"));
      } finally {
        setBooking(false);
      }
    });
  };

  // ── No modes ───────────────────────────────────────────────────────────────
  if (sortedModes.length === 0) {
    return (
      <View className="px-4 gap-3">
        <Heading size="md" className={`text-foreground mb-1 ${isRtl ? "text-right" : ""}`}>{t("chooseYourSpecialist")}</Heading>
        <Divider className="mb-3" />
        <EmptyState title={t("modeEmpty")} />
      </View>
    );
  }

  return (
    <View className="px-4 gap-3">
      <Heading size="md" className={`text-foreground ${isRtl ? "text-right" : ""}`}>{t("chooseYourSpecialist")}</Heading>
      <Divider />

      {/* Mode tabs */}
      <View>
        <Text className={`text-sm font-semibold text-foreground mb-2 ${isRtl ? "text-right" : ""}`}>{t("mode")}:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className={`flex-row gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            {sortedModes.map((et) => {
              const isActive = et.mode === selectedMode;
              return (
                <Pressable
                  key={et.mode}
                  onPress={() => setSelectedMode(et.mode)}
                  className={`px-4 py-2 rounded-xl border ${isActive ? "bg-primary border-primary" : "bg-card border-border"}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text className={`text-sm font-semibold ${isActive ? "text-primary-foreground" : "text-foreground"}`}>
                    {getModeLabel(et.mode, t)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Specialists */}
      {specialistsLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : specialists.length === 0 ? (
        <EmptyState title={t("specialistsEmpty")} />
      ) : (
        <View>
          {specialists.map((sp) => (
            <SpecialistCard
              key={sp._id}
              specialist={sp}
              isSelected={sp._id === selectedSpecialistId}
              onSelect={() => handleSpecialistSelect(sp._id)}
              isFavorite={isFavorite("Specialist", sp._id)}
              onToggleFavorite={() => handleSpecialistFavorite(sp._id)}
            />
          ))}
        </View>
      )}

      {/* Availability (dates/times/price/book) — shown after specialist selected + logged in */}
      {selectedSpecialistId && isLoggedIn && (
        <OfferingAvailabilityCard
          dates={dates}
          datesLoading={datesLoading}
          selectedDateIndex={selectedDateIndex}
          onSelectDate={(idx) => { setSelectedDateIndex(idx); setSelectedSlot(null); }}
          timeSlots={timeSlots}
          timesLoading={timesLoading}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          price={price}
          booking={booking}
          onBook={handleBookSession}
        />
      )}
    </View>
  );
}
