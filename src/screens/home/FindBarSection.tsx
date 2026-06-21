/**
 * FindBarSection — Premium hero + animated segmented FindBar.
 * Section 1 of the home screen.
 *
 * Design:
 *  - Deep prussian gradient hero with turquoise ambient glow spheres.
 *  - Large greeting: "Find Your <Programs>" — dynamic word in turquoise.
 *  - Polished pill segmented control with an animated sliding indicator (Reanimated).
 *  - Floating elevated card with a soft shadow overlapping the hero's bottom.
 *  - Filter fields with leading icons — delegated to FindBarFilters.
 *  - Gradient Find button (prussian → turquoise, via GradientView).
 *
 * Tabs: Programs / Institutions / Offerings
 * RTL: indicator mirrors, rows flip, headline aligns right.
 *
 * Data fetching lives in FindBarFilters to keep this file focused.
 */

import { useState, useEffect } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { BookOpen, Building2, Tag, Search } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { GradientView } from "@/components/shared/GradientView";
import { HomeAppBar } from "@/components/shared/HomeAppBar";
import { FindBarFilters, type ActiveTab, type ProgramValues, type InstitutionValues, type OfferingValues } from "@/screens/home/FindBarFilters";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { brand, SHADOW_COLOR } from "@/config/theme";

interface FindBarSectionProps {
  onLanguageToggle?: () => void;
  onProfilePress?: () => void;
}

export function FindBarSection({ onLanguageToggle, onProfilePress }: FindBarSectionProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>("program");
  const [programValues, setProgramValues] = useState<ProgramValues>({ level: "", field: "", location: "" });
  const [institutionValues, setInstitutionValues] = useState<InstitutionValues>({ level: "", field: "", location: "" });
  const [offeringValues, setOfferingValues] = useState<OfferingValues>({ search: "", field: "", category: "" });
  // Hero entrance animation
  const heroOpacity = useSharedValue(0);
  const heroTranslate = useSharedValue(20);
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslate.value }],
  }));

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
    heroTranslate.value = withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) });
  }, []);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const handleFind = () => {
    if (activeTab === "program") {
      // Programs → FindScreen with sub-tab=programs + optional filters
      const p = new URLSearchParams();
      p.set("find", "programs");
      if (programValues.level) p.set("level", programValues.level);
      if (programValues.field) p.set("field", programValues.field);
      if (programValues.location) p.set("location", programValues.location);
      router.push(`/(main)/find?${p.toString()}` as never);
    } else if (activeTab === "institution") {
      // Institutions → FindScreen with sub-tab=institutions + optional filters
      const p = new URLSearchParams();
      p.set("find", "institutions");
      if (institutionValues.level) p.set("level", institutionValues.level);
      if (institutionValues.field) p.set("field", institutionValues.field);
      if (institutionValues.location) p.set("location", institutionValues.location);
      router.push(`/(main)/find?${p.toString()}` as never);
    } else {
      // Offerings → Growth Center hub
      const p = new URLSearchParams();
      if (offeringValues.search) p.set("search", offeringValues.search);
      if (offeringValues.field) p.set("field", offeringValues.field);
      if (offeringValues.category) p.set("category", offeringValues.category);
      router.push(`/(main)/(tabs)/growth-center?${p.toString()}` as never);
    }
  };

  const dynamicWords: Record<ActiveTab, string> = {
    program: t("programs"),
    institution: t("institution"),
    offering: t("offering"),
  };

  const tabs: { key: ActiveTab; label: string; Icon: typeof BookOpen }[] = [
    { key: "program",     label: t("findPrograms"), Icon: BookOpen  },
    { key: "institution", label: t("institution"),  Icon: Building2 },
    { key: "offering",    label: t("findOffering"), Icon: Tag       },
  ];
  const displayTabs = isRtl ? [...tabs].reverse() : tabs;

  return (
    <View className="relative overflow-hidden">
      {/* Prussian gradient background */}
      <GradientView
        colors={[brand.prussianDeep, brand.prussian, brand.prussian, brand.prussianDark]}
        locations={[0, 0.4, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* Turquoise glow sphere */}
      <View
        className={`absolute -top-12 ${isRtl ? "-left-12" : "-right-12"} w-52 h-52 rounded-full bg-turquoise/10`}
        style={{ transform: [{ scaleX: 1.4 }] }}
      />
      {/* Secondary glow */}
      <View
        className={`absolute -bottom-8 ${isRtl ? "-right-8" : "-left-8"} w-40 h-40 rounded-full bg-turquoise/10`}
      />

      <HomeAppBar onLanguageToggle={onLanguageToggle} onProfilePress={onProfilePress} />

      <Animated.View style={heroStyle} className="px-5 pt-4 pb-8">
        {/* Headline — balanced vertical spacing */}
        <View className={`gap-1 mb-6 ${isRtl ? "items-end" : "items-start"}`}>
          <Text className={`text-white/85 text-sm font-medium tracking-wide ${isRtl ? "text-right" : ""}`}>
            {t("heroSubtitle")}
          </Text>
          <View className={`flex-row flex-wrap items-baseline gap-x-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Heading size="2xl" className="text-white font-black leading-tight">{t("findYour")}</Heading>
            <Heading size="2xl" className="text-turquoise font-black leading-tight flex-shrink">{dynamicWords[activeTab]}</Heading>
          </View>
        </View>

        {/* Floating search card — consistent horizontal margin (px-5 matches hero) */}
        <View
          className="bg-card rounded-3xl overflow-hidden"
          style={{ shadowColor: SHADOW_COLOR, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 20, elevation: 12 }}
        >
          {/* Segmented control — the active segment gets a solid dark pill via an
              inline backgroundColor (reliable on native). The previous version
              painted a separately-positioned animated indicator behind white text;
              when that indicator didn't lay out on native you got white text on the
              light track (invisible). Inline per-segment background avoids that. */}
          <View
            className={`bg-muted border border-border mx-4 mt-4 rounded-2xl p-1 flex-row ${isRtl ? "flex-row-reverse" : ""}`}
          >
            {displayTabs.map(({ key, label, Icon }) => {
              const isActive = activeTab === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => handleTabChange(key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={label}
                  testID={`findbar-tab-${key}`}
                  style={{
                    backgroundColor: isActive ? colors.primary : "transparent",
                    borderRadius: 14,
                  }}
                  className="flex-1 flex-row items-center justify-center gap-1.5 py-3 px-1 min-h-[44px]"
                >
                  <Icon
                    size={13}
                    color={isActive ? colors.primaryForeground : colors.foreground}
                    strokeWidth={isActive ? 2.5 : 2.25}
                  />
                  <Text
                    className={`text-xs font-semibold ${isActive ? "text-primary-foreground" : "text-foreground"}`}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Filter fields — generous padding + gap so the segmented control,
              each field, and the Find button breathe (no cramped rows). */}
          <View style={{ padding: 16, paddingTop: 16, gap: 14 }}>
            <FindBarFilters
              activeTab={activeTab}
              programValues={programValues}
              institutionValues={institutionValues}
              offeringValues={offeringValues}
              onProgramChange={(v) => setProgramValues((s) => ({ ...s, ...v }))}
              onInstitutionChange={(v) => setInstitutionValues((s) => ({ ...s, ...v }))}
              onOfferingChange={(v) => setOfferingValues((s) => ({ ...s, ...v }))}
            />
            <FindButton onPress={handleFind} label={t("find")} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Gradient Find button ─────────────────────────────────────────────────────

function FindButton({ onPress, label }: { onPress: () => void; label: string }) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={pressStyle} className="rounded-2xl overflow-hidden mt-1">
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 20 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 20 }); }}
        accessibilityRole="button"
        accessibilityLabel={label}
        testID="findbar-find"
        style={{ overflow: "hidden", borderRadius: 16 }}
      >
        <GradientView
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 52, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
        >
          <Search size={18} color={colors.onOverlay} strokeWidth={2.5} />
          <Text className="text-white font-bold text-base">{label}</Text>
        </GradientView>
      </Pressable>
    </Animated.View>
  );
}
