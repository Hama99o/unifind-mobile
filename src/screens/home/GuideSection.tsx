/**
 * GuideSection — "How UniFind Guides You" redesigned as two grouped cards.
 *
 * Design:
 *  - SectionHeader for consistent title rhythm.
 *  - Two rounded cards: "Program Explorer" (steps 1-4) + "Growth Center" (steps 5-8).
 *  - Each step: turquoise-tinted icon chip + bold title + concise description.
 *  - A subtle numbered step dot on the left (or right in RTL) connects steps visually.
 *  - Primary gradient CTA on Program card, outline CTA on Growth card.
 *  - Staggered fade/slide-in on mount via Reanimated.
 */

import { useEffect } from "react";
import { View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { GradientView } from "@/components/shared/GradientView";
import {
  Compass,
  ArrowLeftRight,
  MousePointer2,
  Rocket,
  Search,
  MessageSquare,
  Binoculars,
  MailOpen,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { usePressScale } from "@/hooks/usePressScale";
import { SHADOW_COLOR } from "@/config/theme";

const LucideIconMap = {
  compass: Compass,
  arrowLeftRight: ArrowLeftRight,
  mousePointer: MousePointer2,
  rocket: Rocket,
  search: Search,
  messageSquare: MessageSquare,
  binoculars: Binoculars,
  mailOpen: MailOpen,
} as const;

type IconKey = keyof typeof LucideIconMap;

interface GuideStep {
  iconKey: IconKey;
  titleKey: string;
  descKey: string;
}

const PROGRAM_STEPS: GuideStep[] = [
  { iconKey: "compass",        titleKey: "guideStepExploreTitle",  descKey: "guideStepExploreDescription" },
  { iconKey: "arrowLeftRight", titleKey: "guideStepCompareTitle",  descKey: "guideStepCompareDescription" },
  { iconKey: "mousePointer",   titleKey: "guideStepChooseTitle",   descKey: "guideStepChooseDescription" },
  { iconKey: "rocket",         titleKey: "guideStepApplyTitle",    descKey: "guideStepApplyDescription" },
];

const GROWTH_STEPS: GuideStep[] = [
  { iconKey: "search",         titleKey: "guideStepDiscoverTitle", descKey: "guideStepDiscoverDescription" },
  { iconKey: "messageSquare",  titleKey: "guideStepConnectTitle",  descKey: "guideStepConnectDescription" },
  { iconKey: "binoculars",     titleKey: "guideStepLookIntoTitle", descKey: "guideStepLookIntoDescription" },
  { iconKey: "mailOpen",       titleKey: "guideStepRequestTitle",  descKey: "guideStepRequestDescription" },
];

interface GuideSectionProps {
  onFindProgram: () => void;
  onDiscoverGrowth: () => void;
}

function GuideStepRow({ step, index }: { step: GuideStep; index: number }) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const Icon = LucideIconMap[step.iconKey];

  return (
    <View className={`flex-row items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
      {/* Step number dot + icon chip stacked */}
      <View className="items-center gap-1 flex-shrink-0" style={{ marginTop: 2 }}>
        {/* Step number */}
        <View className="w-5 h-5 rounded-full bg-lightgreen items-center justify-center">
          <Text className="text-primary text-[9px] font-black leading-none">{index + 1}</Text>
        </View>
        {/* Connecting line — hidden for last item */}
        {index < 3 ? (
          <View className="w-px flex-1 bg-turquoise/20" style={{ minHeight: 20 }} />
        ) : null}
      </View>
      {/* Icon chip + text — flex-1 so text column never overflows the card */}
      <View
        className={`flex-row items-start gap-2.5 flex-1 min-w-0 pb-3 ${isRtl ? "flex-row-reverse" : ""}`}
      >
        <View className="w-8 h-8 rounded-xl bg-lightgreen items-center justify-center flex-shrink-0">
          <Icon size={15} color={colors.primary} />
        </View>
        {/* flex-1 + min-w-0 lets the text column shrink and wrap fully */}
        <View className="flex-1 min-w-0">
          <Text className={`text-sm font-semibold text-card-foreground leading-tight ${isRtl ? "text-right" : ""}`}>
            {t(step.titleKey)}
          </Text>
          <Text className={`text-xs text-muted-foreground mt-0.5 leading-relaxed ${isRtl ? "text-right" : ""}`}>
            {t(step.descKey)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function GuideCard({
  steps,
  trackLabelKey,
  ctaLabel,
  ctaStyle,
  onCta,
  animOffset,
}: {
  steps: GuideStep[];
  trackLabelKey: string;
  ctaLabel: string;
  ctaStyle: "primary" | "outline";
  onCta: () => void;
  animOffset: number;
}) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const { animStyle: ctaAnimStyle, handlePressIn, handlePressOut } = usePressScale();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    opacity.value = withDelay(animOffset, withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(animOffset, withTiming(0, { duration: 380, easing: Easing.out(Easing.quad) }));
  }, []);

  return (
    <Animated.View style={style} className="w-full">
      <View className="bg-card rounded-2xl p-4" style={{ elevation: 2, shadowColor: SHADOW_COLOR, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }}>
        {/* Track label */}
        <Text
          className={`text-xs font-bold text-foreground uppercase tracking-wider mb-3 ${isRtl ? "text-right" : ""}`}
        >
          {t(trackLabelKey)}
        </Text>

        {steps.map((step, i) => (
          <GuideStepRow key={step.titleKey} step={step} index={i} />
        ))}

        {/* CTA */}
        {ctaStyle === "primary" ? (
          /* Gradient primary: Animated.View driven by usePressScale, mirrors FindButton */
          <Animated.View style={[ctaAnimStyle, { marginTop: 8, borderRadius: 12, overflow: "hidden", height: 44 }]}>
            <GradientView
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <Pressable
                onPress={onCta}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                accessibilityRole="button"
                style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 10 }}
              >
                <Text className="text-white font-bold text-sm">{ctaLabel}</Text>
              </Pressable>
            </GradientView>
          </Animated.View>
        ) : (
          /* Outline secondary: border-primary + text-primary; legible in light + dark */
          <Button
            label={ctaLabel}
            action="primary"
            variant="outline"
            className="mt-2 h-11"
            onPress={onCta}
          />
        )}
      </View>
    </Animated.View>
  );
}

export function GuideSection({ onFindProgram, onDiscoverGrowth }: GuideSectionProps) {
  const { t } = useCustomTranslation();

  return (
    <View className="pt-12 pb-10 px-4 bg-background">
      <SectionHeader titleKey="guidesYou" />

      {/* Two full-width stacked cards */}
      <View className="gap-4">
        <GuideCard
          steps={PROGRAM_STEPS}
          trackLabelKey="guideProgramTrack"
          ctaLabel={t("btnFindProgram")}
          ctaStyle="primary"
          onCta={onFindProgram}
          animOffset={0}
        />
        <GuideCard
          steps={GROWTH_STEPS}
          trackLabelKey="guideGrowthTrack"
          ctaLabel={t("btnDiscoverGrowth")}
          ctaStyle="outline"
          onCta={onDiscoverGrowth}
          animOffset={120}
        />
      </View>
    </View>
  );
}
