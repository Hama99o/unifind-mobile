/**
 * SegmentedPill — reusable segmented tab pill.
 *
 * Token contract (mirrors inline SubTab in FavoritesTab + ComparisonsTab):
 *   active bg:     brand.lightGreen  (else transparent)
 *   border:        brand.turquoise   (else colors.border)
 *   icon color:    brand.prussian    (else colors.mutedForeground)
 *   label:         text-sm + (active → "font-bold text-foreground" | "text-muted-foreground")
 *   borderRadius:  10
 *   RTL-safe:      row direction is not assumed; caller wraps in RTL-aware flex-row/flex-row-reverse
 *
 * `icon` is optional — when omitted the pill renders label-only.
 *
 * Used by: FavoritesTab, ComparisonsTab, AboutMeTab.
 */

import { Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { useColors } from "@/hooks/useColors";
import { brand } from "@/config/theme";

interface SegmentedPillProps {
  label: string;
  /** Optional leading icon component. Rendered at size 15. */
  icon?: React.ComponentType<{ size: number; color: string }>;
  active: boolean;
  onPress: () => void;
}

export function SegmentedPill({ label, icon: Icon, active, onPress }: SegmentedPillProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Icon ? 6 : 0,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: active ? brand.lightGreen : "transparent",
        borderWidth: 1,
        borderColor: active ? brand.turquoise : colors.border,
      }}
    >
      {Icon && (
        <Icon size={15} color={active ? brand.prussian : colors.mutedForeground} />
      )}
      <Text className={`text-sm ${active ? "font-bold text-foreground" : "text-muted-foreground"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
