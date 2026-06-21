/**
 * OfferingDetailsStrip — 5-item horizontal strip below the hero.
 * Hides items where value is null/undefined.
 * Items: Current Location, Available Online, Session Duration,
 *        Number of Sessions, Certificate of Attendance.
 *
 * RTL-safe. No hardcoded hex. Gluestack only.
 */

import { View, ScrollView } from "react-native";
import { MapPin, Laptop, Clock, Hourglass, Award } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";

interface StripItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

interface OfferingDetailsStripProps {
  locationValue?: string | null;
  availableOnline?: boolean | null;
  sessionDuration?: number | null;
  sessionCount?: number | null;
  hasCertificate?: boolean | null;
}

function StripTile({ icon, label, value }: StripItem) {
  const { isRtl } = useCustomTranslation();
  return (
    <View
      className={`flex-row items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 me-2 ${
        isRtl ? "flex-row-reverse" : ""
      }`}
    >
      {icon}
      <View className={isRtl ? "items-end" : "items-start"}>
        <Text className="text-xs text-muted-foreground">{label}</Text>
        <Text className="text-xs font-semibold text-foreground">{value}</Text>
      </View>
    </View>
  );
}

export function OfferingDetailsStrip({
  locationValue,
  availableOnline,
  sessionDuration,
  sessionCount,
  hasCertificate,
}: OfferingDetailsStripProps) {
  const { t } = useCustomTranslation();
  const colors = useColors();

  const items: StripItem[] = [];

  if (locationValue) {
    items.push({
      icon: <MapPin size={14} color={colors.primary} />,
      label: t("currentLocation"),
      value: locationValue,
    });
  }

  if (availableOnline !== null && availableOnline !== undefined) {
    items.push({
      icon: <Laptop size={14} color={colors.primary} />,
      label: t("availableOnline"),
      value: availableOnline ? t("yes") : t("no"),
    });
  }

  if (sessionDuration != null) {
    items.push({
      icon: <Clock size={14} color={colors.primary} />,
      label: t("sessionDuration"),
      value: `${sessionDuration} ${t("min")}`,
    });
  }

  if (sessionCount != null) {
    items.push({
      icon: <Hourglass size={14} color={colors.primary} />,
      label: t("numberOfSessions"),
      value: String(sessionCount),
    });
  }

  if (hasCertificate !== null && hasCertificate !== undefined) {
    items.push({
      icon: <Award size={14} color={colors.primary} />,
      label: t("certificateOfAttendance"),
      value: hasCertificate ? t("yes") : t("no"),
    });
  }

  if (items.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
    >
      {items.map((item, i) => (
        <StripTile key={i} icon={item.icon} label={item.label} value={item.value} />
      ))}
    </ScrollView>
  );
}
