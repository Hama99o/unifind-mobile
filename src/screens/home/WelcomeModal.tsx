/**
 * WelcomeModal — first-launch welcome popup. Celebratory, on-brand.
 *
 * Design:
 *  - Full gradient header: prussian → deep prussian with turquoise glow.
 *  - Large icon + bold welcome title + short subtitle in the header.
 *  - 4 feature bullets: turquoise icon chips + concise copy.
 *  - Gradient CTA button (prussian → turquoise).
 *  - Spring entrance: scale + translateY + fade.
 *  - Cannot be dismissed by backdrop.
 *
 * Shown once on first launch (SecureStore flag).
 */

import { useEffect, useState } from "react";
import { Modal, View, Pressable } from "react-native";
import * as SecureStore from "expo-secure-store";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { GradientView } from "@/components/shared/GradientView";
import {
  Globe,
  Wallet,
  Layers,
  TrendingUp,
  Sparkles,
  Search,
} from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { brand } from "@/config/theme";

const SEEN_KEY = "revamp_2026_seen_v3";

interface BulletItem {
  Icon: typeof Globe;
  textKey: string;
}

const BULLETS: BulletItem[] = [
  { Icon: Globe,       textKey: "welcome_popup.arabic_support" },
  { Icon: Wallet,      textKey: "welcome_popup.whish_integration" },
  { Icon: Layers,      textKey: "welcome_popup.redesigned_interface" },
  { Icon: TrendingUp,  textKey: "welcome_popup.growth_center" },
];

export function WelcomeModal() {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const [visible, setVisible] = useState(false);

  const scale = useSharedValue(0.82);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(32);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    (async () => {
      try {
        const seen = await SecureStore.getItemAsync(SEEN_KEY);
        if (!seen) {
          setVisible(true);
          scale.value = withSpring(1, { damping: 15, stiffness: 150 });
          opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
          translateY.value = withSpring(0, { damping: 17, stiffness: 170 });
        }
      } catch {
        // Fail silently
      }
    })();
  }, []);

  const handleExplore = async () => {
    try {
      await SecureStore.setItemAsync(SEEN_KEY, "true");
    } catch {
      // Fail silently
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View className="flex-1 bg-black/65 items-center justify-center px-5">
        <Animated.View
          style={[animStyle, { shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 16 }]}
          className="w-full max-w-sm rounded-3xl overflow-hidden"
        >
          {/* ── Gradient header ────────────────────────────────────────────── */}
          <GradientView
            colors={[brand.prussianDeep, brand.prussian, brand.prussian]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24, alignItems: "center", position: "relative", overflow: "hidden" }}
          >
            {/* Glow sphere */}
            <View style={{ position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(68,222,209,0.12)" }} />

            {/* Icon */}
            <View className="w-16 h-16 rounded-2xl bg-turquoise/20 items-center justify-center mb-4">
              <Sparkles size={28} color={colors.secondary} strokeWidth={1.8} />
            </View>

            {/* Title */}
            <Heading size="md" className="text-white font-black text-center leading-snug">
              {t("welcome_popup.title")}
            </Heading>
            <Text className="text-white/60 text-xs text-center mt-1.5 leading-relaxed">
              {t("welcome_popup.subtitle")}
            </Text>
          </GradientView>

          {/* ── Bullets ───────────────────────────────────────────────────── */}
          <View className="bg-card px-5 pt-5 pb-4 gap-3.5">
            {BULLETS.map(({ Icon, textKey }) => (
              <View
                key={textKey}
                className={`flex-row items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}
              >
                <View className="w-9 h-9 bg-turquoise/12 rounded-xl items-center justify-center flex-shrink-0">
                  <Icon size={17} color={colors.primary} />
                </View>
                <Text className={`flex-1 text-sm text-card-foreground leading-relaxed ${isRtl ? "text-right" : ""}`}>
                  {t(textKey)}
                </Text>
              </View>
            ))}

            {/* Gradient CTA */}
            <Pressable onPress={handleExplore} accessibilityRole="button" className="mt-2 rounded-2xl overflow-hidden">
              <GradientView
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 52,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                  borderRadius: 16,
                }}
              >
                <Search size={17} color={colors.onOverlay} strokeWidth={2.5} />
                <Text className="text-white font-bold text-base">{t("welcome_popup.explore_now")}</Text>
              </GradientView>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
