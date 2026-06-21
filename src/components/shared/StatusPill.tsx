/**
 * StatusPill — shared component for booking/payment status display.
 *
 * DRY: used by BookingsTab, BookingDetailScreen, and any future screen
 * that needs a colored status badge. Uses theme tokens via NativeWind —
 * NO hardcoded hex.
 *
 * Booking statuses: Pending | Requested | Scheduled | Completed | Canceled
 * Payment statuses: unpaid | paid | refunded | failed
 *
 * Token mapping (S6 token discipline):
 *   completed / refunded  → bg-lightgreen text-foreground          (success)
 *   requested / paid      → bg-lightgreen border-secondary text-foreground (in-progress)
 *   scheduled             → bg-blue-50 border border-blue-200 text-blue-700
 *   pending / unpaid      → bg-amber-50 border border-amber-200 text-amber-700
 *   canceled / failed     → bg-red-50 border border-red-200 text-red-700
 *
 * NOTE: amber/blue/red classes are used because the design system has no
 * dedicated semantic token for "warning" or "scheduled" states. When tokens
 * for those states are added to tailwind.config.js they should replace these.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";

export type BookingStatus = "Pending" | "Requested" | "Scheduled" | "Completed" | "Canceled";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed";
export type PillStatus = BookingStatus | PaymentStatus | string;

/** Maps a status string to semantic NativeWind class names (bg + text + dot). */
function getStatusClasses(status: string): { containerClass: string; textClass: string; dotClass: string } {
  const s = status.toLowerCase();

  // completed / refunded — brand success token
  if (s === "completed" || s === "refunded") {
    return {
      containerClass: "bg-lightgreen border border-lightgreen",
      textClass: "text-foreground",
      dotClass: "bg-primary",
    };
  }

  // requested / paid — in-progress, secondary border accent
  if (s === "requested" || s === "paid") {
    return {
      containerClass: "bg-lightgreen border border-secondary",
      textClass: "text-foreground",
      dotClass: "bg-secondary",
    };
  }

  // scheduled — informational blue (no brand token exists; JSDoc note above)
  if (s === "scheduled") {
    return {
      containerClass: "bg-blue-50 border border-blue-200",
      textClass: "text-blue-700",
      dotClass: "bg-blue-500",
    };
  }

  // pending / unpaid — warning amber (no brand token exists; JSDoc note above)
  if (s === "pending" || s === "unpaid") {
    return {
      containerClass: "bg-amber-50 border border-amber-200",
      textClass: "text-amber-700",
      dotClass: "bg-amber-500",
    };
  }

  // canceled / failed — destructive red (no brand token exists; JSDoc note above)
  if (s === "canceled" || s === "cancelled" || s === "failed") {
    return {
      containerClass: "bg-red-50 border border-red-200",
      textClass: "text-red-700",
      dotClass: "bg-red-500",
    };
  }

  // Fallback — neutral
  return {
    containerClass: "bg-muted border border-border",
    textClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground",
  };
}

interface StatusPillProps {
  status: PillStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  const { containerClass, textClass, dotClass } = getStatusClasses(status);

  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 self-start ${containerClass}`}
    >
      <View className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <Text className={`text-xs font-semibold ${textClass}`}>{status}</Text>
    </View>
  );
}
