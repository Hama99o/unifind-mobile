/**
 * OfferingTimeSlot — time-slot chip for the booking flow.
 *
 * Hides fully-booked slots. Formats "HH:mm" Beirut strings to 12-h display.
 * RTL-safe. No hardcoded hex. Gluestack only.
 */

import { Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import type { TimeSlot } from "@/api/availabilityApi";

// ─── Format "HH:mm" Beirut string to 12-h display (no TZ conversion needed) ──

export function formatBeirutTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  let h = parseInt(hStr, 10) % 24; // guard "24:00" → 0
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${String(m).padStart(2, "0")} ${period}`;
}

interface OfferingTimeSlotProps {
  slot: TimeSlot;
  selected: boolean;
  onPress: () => void;
}

export function OfferingTimeSlot({ slot, selected, onPress }: OfferingTimeSlotProps) {
  if (slot.fullyBooked) return null;

  const label = `${formatBeirutTime(slot.start)} – ${formatBeirutTime(slot.end)}`;

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl border px-3 py-2 me-2 mb-2 ${
        selected ? "bg-primary border-primary" : "bg-card border-border"
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text className={`text-xs font-semibold ${selected ? "text-primary-foreground" : "text-foreground"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
