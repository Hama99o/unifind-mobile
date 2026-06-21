/**
 * OfferingDayCard — horizontal day-picker chip for the booking flow.
 *
 * Uses useLocalization().formatDate for weekday/month display (Beirut TZ baked in).
 * RTL-safe. No hardcoded hex. Gluestack only.
 */

import { Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { useLocalization } from "@/hooks/useLocalization";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import type { AvailabilityDate } from "@/api/availabilityApi";

interface OfferingDayCardProps {
  item: AvailabilityDate;
  selected: boolean;
  onPress: () => void;
}

export function OfferingDayCard({ item, selected, onPress }: OfferingDayCardProps) {
  const { formatDate } = useLocalization();
  const { t } = useCustomTranslation();

  // Parse YYYY-MM-DD — add noon offset to avoid TZ day-shift in Beirut
  const dateObj = new Date(item.date + "T12:00:00");

  const dayName = formatDate(dateObj, { weekday: "short" });
  const dayNum = dateObj.getDate();
  const monthAbbr = formatDate(dateObj, { month: "short" });

  return (
    <Pressable
      onPress={onPress}
      className={`items-center justify-center rounded-xl border px-3 py-2 me-2 ${
        selected ? "bg-primary border-primary" : "bg-card border-border"
      }`}
      style={{ minWidth: 72 }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text className={`text-xs font-semibold ${selected ? "text-primary-foreground" : "text-muted-foreground"}`}>
        {dayName}
      </Text>
      <Text className={`text-lg font-bold ${selected ? "text-primary-foreground" : "text-foreground"}`}>
        {dayNum}
      </Text>
      <Text className={`text-xs ${selected ? "text-primary-foreground" : "text-muted-foreground"}`}>
        {monthAbbr}
      </Text>
      <Text className={`text-xs mt-0.5 ${selected ? "text-primary-foreground" : "text-primary"}`}>
        {item.slotsCount} {t("slots")}
      </Text>
    </Pressable>
  );
}
