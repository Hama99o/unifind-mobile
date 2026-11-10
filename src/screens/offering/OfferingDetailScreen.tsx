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
import { reviewsApi } from "@/api/reviewsApi";
import { offeringDetailApi } from "@/api/offeringDetailApi";
import { nodeOfferingApi } from "@/api/nodeOfferingApi";
import { showToast } from "@/stores/toastStore";

import type { StrapiOfferingDetail } from "@/api/offeringDetailApi";
import type { NodeOfferingDetail, NodeOfferingSpecialist } from "@/api/nodeOfferingApi";

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

  // ── Data state ─────────────────────────────────────────────────────────────
  const [strapiOffering, setStrapiOffering] = useState<StrapiOfferingDetail | null>(null);
  const [nodeOffering, setNodeOffering] = useState<NodeOfferingDetail | null>(null);
  const [specialists, setSpecialists] = useState<NodeOfferingSpecialist[]>([]);
  const [averages, setAverages] = useState(ZERO_AVG);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // ── Specialist section scroll ref ──────────────────────────────────────────
  const scrollViewRef = useRef<ScrollView>(null);
  const specialistSectionRef = useRef<View>(null);
  const specialistSectionY = useRef<number>(0);

  // ── Load data ──────────────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    if (!slug) return;
    if (!silent) setLoading(true);

    const [strapi, node] = await Promise.all([
      offeringDetailApi.getBySlug(slug, lang === "ar" ? "ar" : "en"),
      nodeOfferingApi.getBySlug(slug),
    ]);

    if (!strapi || !node) {
      setNotFound(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setStrapiOffering(strapi);
    setNodeOffering(node);

    // Rating (by Strapi id — numeric)
    const avg = await reviewsApi.getAllAverageRating("Offering", String(strapi.id));
    setAverages({
      averageGeneralRating: avg.averageGeneralRating,
      averageHelpfulnessRating: avg.averageHelpfulnessRating,
      averagespecialistRating: avg.averagespecialistRating,
      averagerecommendRating: avg.averagerecommendRating,
      totalReviews: avg.totalReviews,
      star5: avg.star5,
      star4: avg.star4,
      star3: avg.star3,
      star2: avg.star2,
      star1: avg.star1,
    });

    // Specialists from first mode (for avatar stack in hero)
    if (node.specialists && node.specialists.length > 0) {
      setSpecialists(node.specialists);
    }

    // H1 fix: seed via canonical seedSelection (uses userID not raw sub)
    await seedSelection(["Offering", "Specialist"]);

    setLoading(false);
    setRefreshing(false);
  }, [slug, lang, isLoggedIn, seedSelection]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Refresh control ────────────────────────────────────────────────────────
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

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
