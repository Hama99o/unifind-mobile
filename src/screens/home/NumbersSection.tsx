/**
 * NumbersSection — "Unifind In Numbers" premium stat band.
 *
 * Design:
 *  - Prussian band with subtle turquoise grid line texture (border-top accent).
 *  - SectionHeader (on-dark).
 *  - True 2-column grid of elevated StatTile components.
 *  - Each tile: turquoise icon chip, large bold number, muted label.
 *  - Staggered fade-in animation per row.
 *
 * Section 4 of the home screen.
 */

import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import {
  Building, BookOpen, UserCheck, TrendingUp, Users, Eye,
} from "lucide-react-native";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatTile, type StatTileProps } from "@/components/shared/StatTile";
import { useColors } from "@/hooks/useColors";

const STATS: StatTileProps[] = [
  { Icon: Building,   value: "44+",       labelKey: "numbers.institutions" },
  { Icon: BookOpen,   value: "2,750+",    labelKey: "numbers.programs" },
  { Icon: UserCheck,  value: "3,500+",    labelKey: "numbers.registered_users" },
  { Icon: TrendingUp, value: "30,000+",   labelKey: "numbers.yearly_visitors" },
  { Icon: Users,      value: "3,500+",    labelKey: "numbers.social_media_followers" },
  { Icon: Eye,        value: "100,000+",  labelKey: "numbers.monthly_social_media_views" },
];

function StaggeredRow({
  left,
  right,
  delay,
}: {
  left: StatTileProps;
  right: StatTileProps;
  delay: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 380, easing: Easing.out(Easing.quad) }));
  }, []);

  // NOTE: NativeWind className (flex-row/gap) does NOT apply to reanimated
  // Animated.View — the row layout + gap MUST be real styles here, else the
  // tiles fall back to a full-width column with no gap.
  return (
    <Animated.View style={[{ flexDirection: "row", gap: 12 }, style]}>
      <StatTile {...left} />
      <StatTile {...right} />
    </Animated.View>
  );
}

export function NumbersSection() {
  const colors = useColors();
  const rows: [StatTileProps, StatTileProps][] = [
    [STATS[0], STATS[1]],
    [STATS[2], STATS[3]],
    [STATS[4], STATS[5]],
  ];

  return (
    <View className="bg-prussian" style={{ borderTopWidth: 2, borderTopColor: colors.secondary }}>
      <View className="pt-7 pb-6 px-4">
        <SectionHeader titleKey="unifindByTheNumbers" onDark />
        <View className="gap-3">
          {rows.map(([left, right], i) => (
            <StaggeredRow key={i} left={left} right={right} delay={i * 80} />
          ))}
        </View>
      </View>
    </View>
  );
}
