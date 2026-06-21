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

import { type ViewStyle } from "react-native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Skeleton } from "@/components/ui/skeleton";
import { brand } from "@/config/theme";

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
          <Skeleton className={`w-full h-36 ${tone}`} />
          <View className="p-3 gap-2">
            <Skeleton className={`h-4 w-40 rounded ${tone}`} />
            <Skeleton className={`h-3 w-24 rounded-full ${tone}`} />
            <Skeleton className={`h-3 w-full rounded ${tone}`} />
            <Skeleton className={`h-3 w-2/3 rounded ${tone}`} />
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
      <Skeleton className={`w-1 h-6 rounded-full ${tone}`} />
      <Skeleton className={`h-5 w-48 rounded-lg ${tone}`} />
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
          <Skeleton className={`h-7 w-28 rounded-lg ${D}`} />
          <View className="flex-row items-center gap-2">
            <Skeleton className={`h-8 w-14 rounded-full ${D}`} />
            <Skeleton className={`h-9 w-9 rounded-full ${D}`} />
          </View>
        </View>
        {/* Greeting */}
        <Skeleton className={`h-4 w-40 rounded mb-2 ${D}`} />
        <Skeleton className={`h-8 w-56 rounded mb-6 ${D}`} />

        {/* Floating find card */}
        <View className="bg-card rounded-3xl p-4 gap-3">
          {/* Segmented control */}
          <View className="flex-row gap-2">
            <Skeleton className={`flex-1 h-11 rounded-2xl ${L}`} />
            <Skeleton className={`flex-1 h-11 rounded-2xl ${L}`} />
            <Skeleton className={`flex-1 h-11 rounded-2xl ${L}`} />
          </View>
          {/* Three fields */}
          <Skeleton className={`w-full rounded-xl ${L}`} style={{ height: 52 } as ViewStyle} />
          <Skeleton className={`w-full rounded-xl ${L}`} style={{ height: 52 } as ViewStyle} />
          <Skeleton className={`w-full rounded-xl ${L}`} style={{ height: 52 } as ViewStyle} />
          {/* Find button */}
          <Skeleton className={`w-full rounded-2xl ${L}`} style={{ height: 52 } as ViewStyle} />
        </View>
      </View>

      {/* ── Guide section (white) ─────────────────────────────────────────── */}
      <View className="bg-background pt-7 pb-6">
        <TitleBone tone={L} />
        <View className="px-4 gap-3">
          {/* Two card-shaped guide blocks matching the real GuideCard layout */}
          {[0, 1].map((i) => (
            <View key={i} className={`rounded-2xl overflow-hidden ${L}`}>
              <Skeleton className={`w-full h-52 ${L}`} />
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
              <Skeleton className={`flex-1 rounded-2xl ${D}`} style={{ height: 120 } as ViewStyle} />
              <Skeleton className={`flex-1 rounded-2xl ${D}`} style={{ height: 120 } as ViewStyle} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
