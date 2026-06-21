/**
 * HubTile — generic icon + label + count tile.
 *
 * Extracted from the ExplorerTile pattern in ProgramExplorerHubCards.
 * Used by ProgramExplorer (field/degree tiles) and GrowthCenter hub cards.
 *
 * Props:
 *   label     — display text (translatable, 2-line max)
 *   count     — optional numeric count shown below the label
 *   icon      — optional icon component; when provided, rendered inside an
 *               IconCircle (size 40, bg-lightgreen). When omitted the icon
 *               circle is not rendered (label-only tile).
 *   iconColor — color passed to the icon; defaults to colors.primary
 *   onPress   — press handler
 *   style     — optional ViewStyle for the outer Animated.View (e.g. width)
 *
 * Visual: bg-card rounded-2xl p-4, centered, shadow-sm, 0.97 press scale.
 * RTL: text alignment controlled by caller (isRtl context) or the label
 *      always renders centered (safe for icon tiles).
 *
 * Batch C will replace the inline ExplorerTile in ProgramExplorerHubCards
 * and the inline HubCard in GrowthCenterHubCards with this component.
 */

import React from "react";
import { Pressable, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { IconCircle } from "@/components/shared/IconCircle";
import { usePressScale } from "@/hooks/usePressScale";
import { useColors } from "@/hooks/useColors";

export interface HubTileProps {
  label: string;
  count?: number;
  /** Lucide icon component. When omitted the IconCircle is not rendered. */
  icon?: React.ComponentType<{ size: number; color: string }>;
  /** Color for the icon. Defaults to colors.primary (prussian). */
  iconColor?: string;
  onPress: () => void;
  /** Additional style for the outer animated container (e.g. width). */
  style?: ViewStyle;
}

export function HubTile({ label, count, icon: Icon, iconColor, onPress, style }: HubTileProps) {
  const { animStyle, handlePressIn, handlePressOut } = usePressScale();
  const colors = useColors();
  const resolvedIconColor = iconColor ?? colors.primary;

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        className="bg-card border border-border rounded-2xl p-4 items-center justify-center gap-2 shadow-sm"
        style={{ minHeight: 100 }}
      >
        {Icon && (
          <IconCircle size={40}>
            <Icon size={20} color={resolvedIconColor} />
          </IconCircle>
        )}
        <Text
          className="text-foreground text-xs font-semibold text-center"
          numberOfLines={2}
        >
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <Text className="text-xs text-muted-foreground">{count}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
