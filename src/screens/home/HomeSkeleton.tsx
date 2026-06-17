/**
 * HomeSkeleton — full-page loading placeholder for the entire home screen.
 *
 * Shows ONE cohesive skeleton for every section at once (hero + find card,
 * guide, carousels, numbers grid, testimonials) so the page never loads
 * partially — no section pops in while another is still a placeholder.
 * Shape mirrors HomeScreen so nothing shifts when the real content arrives.
 *
 * Light-mode only (the app is locked to light): bones are `bg-foreground/10`
 * on white surfaces and `bg-white/15` on the prussian bands.
 */

import { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { brand } from "@/config/theme";

/** A single shimmering placeholder block. */
function Bone({ className, style }: { className: string; style?: ViewStyle }) {
  const opacity = useSharedValue(0.45);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[animStyle, style]} className={className} />;
}

/** Light bone (on white surfaces). */
const L = "bg-foreground/10";
/** Dark-band bone (on prussian surfaces). */
const D = "bg-white/15";

/** A horizontal row of 3 card bones (carousel placeholder). */
function CardRow({ tone }: { tone: string }) {
  return (
    <View className="flex-row gap-3 overflow-hidden px-4">
      {[0, 1, 2].map((i) => (
        <View key={i} className={`w-64 rounded-2xl overflow-hidden flex-shrink-0 ${tone}`}>
          <Bone className={`w-full h-36 ${tone}`} />
          <View className="p-3 gap-2">
            <Bone className={`h-4 w-40 rounded ${tone}`} />
            <Bone className={`h-3 w-24 rounded-full ${tone}`} />
            <Bone className={`h-3 w-full rounded ${tone}`} />
            <Bone className={`h-3 w-2/3 rounded ${tone}`} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** A section title bone (accent bar + text). */
function TitleBone({ tone }: { tone: string }) {
  return (
    <View className="flex-row items-center gap-2 px-4 mb-5">
      <Bone className={`w-1 h-6 rounded-full ${tone}`} />
      <Bone className={`h-5 w-48 rounded-lg ${tone}`} />
    </View>
  );
}

export function HomeSkeleton() {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* ── Hero band + find card ─────────────────────────────────────────── */}
      <View className="bg-prussian px-5 pt-3 pb-8">
        {/* App bar: wordmark + lang + avatar */}
        <View className="flex-row items-center justify-between mb-7">
          <Bone className={`h-7 w-28 rounded-lg ${D}`} />
          <View className="flex-row items-center gap-2">
            <Bone className={`h-8 w-14 rounded-full ${D}`} />
            <Bone className={`h-9 w-9 rounded-full ${D}`} />
          </View>
        </View>
        {/* Greeting */}
        <Bone className={`h-4 w-40 rounded mb-2 ${D}`} />
        <Bone className={`h-8 w-56 rounded mb-6 ${D}`} />

        {/* Floating find card */}
        <View className="bg-card rounded-3xl p-4 gap-3">
          {/* Segmented control */}
          <View className="flex-row gap-2">
            <Bone className={`flex-1 h-11 rounded-2xl ${L}`} />
            <Bone className={`flex-1 h-11 rounded-2xl ${L}`} />
            <Bone className={`flex-1 h-11 rounded-2xl ${L}`} />
          </View>
          {/* Three fields */}
          <Bone className={`h-13 w-full rounded-xl ${L}`} style={{ height: 52 }} />
          <Bone className={`w-full rounded-xl ${L}`} style={{ height: 52 }} />
          <Bone className={`w-full rounded-xl ${L}`} style={{ height: 52 }} />
          {/* Find button */}
          <Bone className={`w-full rounded-2xl ${L}`} style={{ height: 52 }} />
        </View>
      </View>

      {/* ── Guide section (white) ─────────────────────────────────────────── */}
      <View className="bg-background pt-7 pb-6">
        <TitleBone tone={L} />
        <View className="px-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <View key={i} className="flex-row items-start gap-3">
              <Bone className={`w-8 h-8 rounded-xl ${L}`} />
              <View className="flex-1 gap-1.5">
                <Bone className={`h-4 w-32 rounded ${L}`} />
                <Bone className={`h-3 w-full rounded ${L}`} />
                <Bone className={`h-3 w-3/4 rounded ${L}`} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Offerings carousel (prussian band) ────────────────────────────── */}
      <View className="bg-prussian pt-7 pb-6" style={{ borderTopWidth: 2, borderTopColor: brand.turquoise }}>
        <TitleBone tone={D} />
        <CardRow tone={D} />
      </View>

      {/* ── Numbers grid (prussian band) ──────────────────────────────────── */}
      <View className="bg-prussian pt-7 pb-6 px-4" style={{ borderTopWidth: 2, borderTopColor: brand.turquoise }}>
        <TitleBone tone={D} />
        <View className="gap-3">
          {[0, 1].map((row) => (
            <View key={row} className="flex-row gap-3">
              <Bone className={`flex-1 rounded-2xl ${D}`} style={{ height: 120 }} />
              <Bone className={`flex-1 rounded-2xl ${D}`} style={{ height: 120 }} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
