/**
 * HomeScreen — premium home page composition (100% parity with web /[locale]).
 *
 * Sections (in order):
 *  1. FindBarSection      — gradient hero + animated segmented FindBar
 *  2. GuideSection        — "How UniFind Guides You" — 8 steps in two guide cards
 *  3. FeaturedOfferingsSection  — dark prussian carousel
 *  4. NumbersSection      — stat band (turquoise numbers, 2-col tiles)
 *  5. FeaturedInstitutionsSection — dark prussian carousel
 *  6. TestimonialsSection — "What Students Say" snap carousel
 *
 * WelcomeModal — shown once on first launch.
 * HomeAppBar — embedded inside FindBarSection hero.
 *
 * Business logic is in the section files; this file stays under 60 lines.
 */

import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { FindBarSection } from "@/screens/home/FindBarSection";
import { GuideSection } from "@/screens/home/GuideSection";
import { FeaturedOfferingsSection } from "@/screens/home/FeaturedOfferingsSection";
import { NumbersSection } from "@/screens/home/NumbersSection";
import { FeaturedInstitutionsSection } from "@/screens/home/FeaturedInstitutionsSection";
import { TestimonialsSection } from "@/screens/home/TestimonialsSection";
import { WelcomeModal } from "@/screens/home/WelcomeModal";

export default function HomeScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();

  const handleFindProgram = () => {
    router.push("/(main)/(tabs)/program-explorer");
  };

  const handleDiscoverGrowth = () => {
    router.push("/(main)/(tabs)/growth-center");
  };

  const handleLanguageToggle = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
  };

  const handleProfilePress = () => {
    router.push("/(main)/(tabs)/profile");
  };

  return (
    // edges={[]} — hero gradient covers the full status-bar area intentionally
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces
      >
        <FindBarSection
          onLanguageToggle={handleLanguageToggle}
          onProfilePress={handleProfilePress}
        />
        <GuideSection
          onFindProgram={handleFindProgram}
          onDiscoverGrowth={handleDiscoverGrowth}
        />
        <FeaturedOfferingsSection />
        <NumbersSection />
        <FeaturedInstitutionsSection />
        <TestimonialsSection />
        {/* Bottom breathing room above tab bar */}
        <View className="h-8" />
      </ScrollView>

      {/* Welcome popup — shown once on first launch */}
      <WelcomeModal />
    </SafeAreaView>
  );
}
