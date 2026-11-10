/**
 * OfferingDetailScreen — orchestrator for offering detail.
 * Web parity: /[locale]/growth-center/offerings/[slug]
 *
 * Two-source fetch (parallel):
 *   - Strapi: offeringDetailApi.getBySlug(slug)
 *   - Node:   nodeOfferingApi.getBySlug(slug)
 *
 * Then:
 *   - Rating: reviewsApi.getAllAverageRating("Offering", strapiOffering.id)
 *   - Favorites: favoritesApi.getFavoriteIds(userId, "Offering") when logged in
 *
 * Sections:
 *   1. OfferingHeroSection
 *   2. OfferingDetailsStrip
 *   3. OfferingOverviewSection
 *   4. OfferingResultsSection (Core Learnings)
 *   5. OfferingRequirementsSection (Recommended to Have)
 *   6. OfferingSpecialistSection (booking flow)
 *   7. OfferingReviewsSection (read-only)
 *
 * Not-found → EmptyState. Loading → OfferingDetailSkeleton.
 * RefreshControl. ScrollView with sectionRef for "Book a Seat" scroll-to.
 *
 * RTL-safe. No hardcoded hex. Gluestack only.
 */

import { useRef, useCallback, useEffect, useState } from "react";
import { ScrollView, View, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/shared/AppHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { OfferingDetailSkeleton } from "@/screens/offering/OfferingDetailSkeleton";
import { OfferingHeroSection } from "@/screens/offering/OfferingHeroSection";
import { OfferingDetailsStrip } from "@/screens/offering/OfferingDetailsStrip";
import { OfferingOverviewSection } from "@/screens/offering/OfferingOverviewSection";
import { OfferingResultsSection } from "@/screens/offering/OfferingResultsSection";
import { OfferingRequirementsSection } from "@/screens/offering/OfferingRequirementsSection";
import { OfferingSpecialistSection } from "@/screens/offering/OfferingSpecialistSection";
import { OfferingReviewsSection } from "@/screens/offering/OfferingReviewsSection";

import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useAuthStore } from "@/stores/authStore";
import { useSelection } from "@/hooks/useSelection";
import { useOfferingDetail } from "@/hooks/queries/useOfferingDetail";
import { showToast } from "@/stores/toastStore";


// ─── Averages zero-value ──────────────────────────────────────────────────────

const ZERO_AVG = {
  averageGeneralRating: 0,
  averageHelpfulnessRating: 0,
  averagespecialistRating: 0,
  averagerecommendRating: 0,
  totalReviews: 0,
  star5: 0, star4: 0, star3: 0, star2: 0, star1: 0,
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function OfferingDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, isRtl, lang } = useCustomTranslation();

  const { isLoggedIn, user } = useAuthStore();
  const { isFavorite, toggleFavorite, seedSelection } = useSelection();

  // ── Server state (React Query): cached, so a revisit renders at once ──────
  const {
    strapiOffering,
    nodeOffering,
    specialists,
    averages: averagesData,
    loading,
    notFound,
    refetchAll,
  } = useOfferingDetail(slug, lang === "ar" ? "ar" : "en", user?.userID);
  const averages = averagesData
    ? {
        averageGeneralRating: averagesData.averageGeneralRating,
        averageHelpfulnessRating: averagesData.averageHelpfulnessRating,
        averagespecialistRating: averagesData.averagespecialistRating,
        averagerecommendRating: averagesData.averagerecommendRating,
        totalReviews: averagesData.totalReviews,
        star5: averagesData.star5,
        star4: averagesData.star4,
        star3: averagesData.star3,
        star2: averagesData.star2,
        star1: averagesData.star1,
      }
    : ZERO_AVG;
  const [refreshing, setRefreshing] = useState(false);

  // ── Specialist section scroll ref ──────────────────────────────────────────
  const scrollViewRef = useRef<ScrollView>(null);
  const specialistSectionRef = useRef<View>(null);
  const specialistSectionY = useRef<number>(0);

  // Seed favorite state for the signed-in user (not server-cached data).
  useEffect(() => {
    if (strapiOffering) void seedSelection(["Offering", "Specialist"]);
  }, [strapiOffering, isLoggedIn, seedSelection]);

  // ── Refresh control ────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setRefreshing(false);
    }
  }, [refetchAll]);

  // ── Favorite toggle — H1 fix: use canonical toggleFavorite ────────────────
  const handleToggleFavorite = () => {
    if (!strapiOffering) return;
    toggleFavorite("Offering", String(strapiOffering.id));
  };

  // ── Scroll to specialist section ──────────────────────────────────────────
  const scrollToSpecialists = useCallback(() => {
    if (specialistSectionY.current > 0) {
      scrollViewRef.current?.scrollTo({ y: specialistSectionY.current - 20, animated: true });
    }
  }, []);

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <AppHeader title={t("offering")} showBack />
        <OfferingDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (notFound || !strapiOffering || !nodeOffering) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <AppHeader title={t("offering")} showBack />
        <EmptyState title={t("notFound")} description={t("notFoundDesc")} />
      </SafeAreaView>
    );
  }

  const itemId = String(strapiOffering.id);
  const currentlyFav = isFavorite("Offering", itemId);

  const locationValue =
    strapiOffering.location?.city?.name ?? strapiOffering.location?.street ?? null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <AppHeader title={strapiOffering.title ?? t("offering")} showBack />

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 1. Hero */}
        <OfferingHeroSection
          offering={strapiOffering}
          specialists={specialists}
          rating={averages.averageGeneralRating}
          nbReviews={averages.totalReviews}
          isFavorite={currentlyFav}
          onToggleFavorite={handleToggleFavorite}
          onBookSeatPress={scrollToSpecialists}
        />

        {/* 2. Details strip */}
        <OfferingDetailsStrip
          locationValue={locationValue}
          availableOnline={strapiOffering.availableOnline}
          sessionDuration={nodeOffering.sessionDuration}
          sessionCount={nodeOffering.sessionCount}
          hasCertificate={strapiOffering.hasCertificate}
        />

        {/* 3. Overview */}
        <View className="mt-4 gap-4">
          <OfferingOverviewSection offering={strapiOffering} />

          {/* 4. Core Learnings */}
          <OfferingResultsSection offering={strapiOffering} />

          {/* 5. Requirements */}
          <OfferingRequirementsSection offering={strapiOffering} />

          {/* 6. Specialist + booking flow */}
          <View
            ref={specialistSectionRef}
            onLayout={(e) => {
              specialistSectionY.current = e.nativeEvent.layout.y;
            }}
          >
            <OfferingSpecialistSection nodeOffering={nodeOffering} />
          </View>

          {/* 7. Reviews */}
          <OfferingReviewsSection
            strapiId={String(strapiOffering.id)}
            averages={averages}
          />
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
