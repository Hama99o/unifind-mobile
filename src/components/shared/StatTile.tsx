/**
 * StatTile — compact stat card used in NumbersSection.
 *
 * Fixed height (120px) so all tiles in a 2-column grid are the same size.
 * Renders: small icon chip, turquoise bold value, muted label.
 * Designed to sit inside a 2-column grid on a prussian background.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import type { LucideIcon } from "lucide-react-native";

const TILE_H = 120;

export interface StatTileProps {
  Icon: LucideIcon;
  value: string;
  labelKey: string;
}

export function StatTile({ Icon, value, labelKey }: StatTileProps) {
  const { t } = useCustomTranslation();
  const colors = useColors();

  return (
    <View
      className="flex-1 bg-white/10 border border-white/10 rounded-2xl items-center justify-center"
      style={{ height: TILE_H, paddingHorizontal: 10, paddingVertical: 12, gap: 6 }}
    >
      {/* Icon chip — compact 32px */}
      <View
        className="rounded-xl bg-turquoise/20 items-center justify-center"
        style={{ width: 32, height: 32 }}
      >
        <Icon size={16} color={colors.secondary} />
      </View>
      {/* Value — turquoise, prominent */}
      <Text className="text-turquoise text-2xl font-black leading-none" numberOfLines={1}>
        {value}
      </Text>
      {/* Label — muted white, centered */}
      <Text className="text-xs text-white/65 text-center leading-tight font-medium" numberOfLines={2}>
        {t(labelKey)}
      </Text>
    </View>
  );
}
