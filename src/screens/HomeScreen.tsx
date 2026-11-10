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
import { useQuery } from "@tanstack/react-query";
import { setAppLanguage } from "@/i18n/language";

import { FindBarSection } from "@/screens/home/FindBarSection";
import { GuideSection } from "@/screens/home/GuideSection";
import { FeaturedOfferingsSection } from "@/screens/home/FeaturedOfferingsSection";
import { NumbersSection } from "@/screens/home/NumbersSection";
import { FeaturedInstitutionsSection } from "@/screens/home/FeaturedInstitutionsSection";
import { TestimonialsSection } from "@/screens/home/TestimonialsSection";
import { WelcomeModal } from "@/screens/home/WelcomeModal";
import { HomeSkeleton } from "@/screens/home/HomeSkeleton";
import { AppFooter } from "@/components/shared/AppFooter";
import { fetchFeaturedOfferings, fetchFeaturedInstitutions } from "@/api/catalog";
import { fetchTestimonials } from "@/services/testimonialsService";

export default function HomeScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar" : "en";

  // Observe the home's async data here (same query keys/fns as the sections, so
  // react-query shares one cache — no duplicate network calls). We render ONE
  // full-page skeleton until all of it has loaded, so the page never appears
  // partially. Once loaded, each section reads its data from cache and renders
  // immediately (its own per-section skeleton never triggers).
  const offerings = useQuery({
    queryKey: ["featuredOfferings", locale],
    queryFn: () => fetchFeaturedOfferings(locale),
    staleTime: 5 * 60 * 1000,
  });
  const institutions = useQuery({
    queryKey: ["featuredInstitutions", locale],
    queryFn: () => fetchFeaturedInstitutions(locale),
    staleTime: 5 * 60 * 1000,
  });
  const testimonials = useQuery({
    queryKey: ["testimonials", locale],
    queryFn: () => fetchTestimonials(locale),
    staleTime: 5 * 60 * 1000,
  });
  const isHomeLoading =
    offerings.isLoading || institutions.isLoading || testimonials.isLoading;

  const handleFindProgram = () => {
    router.push("/(main)/(tabs)/program-explorer");
  };

  const handleDiscoverGrowth = () => {
    router.push("/(main)/(tabs)/growth-center");
  };

  const handleLanguageToggle = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    void setAppLanguage(next);
  };

  const handleProfilePress = () => {
    router.push("/(main)/(tabs)/profile");
  };

  // One cohesive skeleton for the whole page while data loads.
  if (isHomeLoading) return <HomeSkeleton />;

  return (
    // edges={[]} — hero gradient covers the full status-bar area intentionally
    <SafeAreaView edges={["top"]} className="flex-1 bg-background" testID="home-screen">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces
        testID="home-scroll"
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
        {/* Footer — mirrors web UFContactUs (logo, contact, socials, nav, newsletter) */}
        <AppFooter />
        {/* Bottom breathing room above tab bar */}
        <View className="h-8" />
      </ScrollView>

      {/* Welcome popup — shown once on first launch */}
      <WelcomeModal />
    </SafeAreaView>
  );
}
