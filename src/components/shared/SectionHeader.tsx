/**
 * SectionHeader — shared section title component used across all home sections.
 *
 * Renders a bold heading with an optional turquoise left accent bar, and
 * an optional "See all" affordance on the opposing side. RTL-safe.
 */

import { View, Pressable } from "react-native";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { ChevronRight, ChevronLeft } from "lucide-react-native";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";

interface SectionHeaderProps {
  titleKey: string;
  onSeeAll?: () => void;
  /** When true, text and accent colors are white (dark sections) */
  onDark?: boolean;
  className?: string;
}

export function SectionHeader({
  titleKey,
  onSeeAll,
  onDark = false,
  className,
}: SectionHeaderProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <View
      className={`flex-row items-center justify-between mb-5 ${isRtl ? "flex-row-reverse" : ""} ${className ?? ""}`}
    >
      {/* Left (or right in RTL): accent bar + title */}
      <View className={`flex-row items-center gap-2.5 ${isRtl ? "flex-row-reverse" : ""}`}>
        <View className="w-1 h-7 bg-turquoise rounded-full" />
        <Heading
          size="md"
          className={`font-bold tracking-tight ${onDark ? "text-white" : "text-foreground"}`}
        >
          {t(titleKey)}
        </Heading>
      </View>

      {/* Right (or left in RTL): "See all" link */}
      {onSeeAll ? (
        <Pressable
          onPress={onSeeAll}
          hitSlop={12}
          accessibilityRole="button"
          className={`flex-row items-center gap-0.5 ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <Text
            className={`text-sm font-semibold ${onDark ? "text-turquoise" : "text-primary"}`}
          >
            {t("seeAll")}
          </Text>
          <ArrowIcon size={14} color={onDark ? colors.secondary : colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}
