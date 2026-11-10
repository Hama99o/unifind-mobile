/**
 * InstitutionDetailScreen — Web parity: /[locale]/program-explorer/institutions/[slug]
 *
 * Sections:
 *   1. Hero — cover + HeroDetailCard + key stats
 *   2. Overview — rich text + InfoCards + RankingCards
 *   3. Academic Programs & Degrees — degree tabs + search + faculty accordions
 *   4. Tuition Fees — table (hidden if empty)
 *   5. Reviews — overview + category cards + review list + review form
 *
 * Not-found state: shows EmptyState (no crash).
 * Auth0: favorite + compare + review gated.
 * Two backends: Strapi for catalog; Node for reviews/favorites/compares.
 *
 * RTL-safe. Gluestack only. No hardcoded hex.
 */

import { useRef, useEffect, useState } from "react";
import { ScrollView, View, RefreshControl } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/shared/AppHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CompareBar } from "@/components/common/CompareBar";
import { InstitutionHeroSection } from "@/screens/institution/InstitutionHeroSection";
import { InstitutionOverviewSection } from "@/screens/institution/InstitutionOverviewSection";
import { InstitutionAcademicSection } from "@/screens/institution/InstitutionAcademicSection";
import { InstitutionTuitionSection } from "@/screens/institution/InstitutionTuitionSection";
import { InstitutionReviewsSection } from "@/screens/institution/InstitutionReviewsSection";
import { InstitutionDetailSkeleton } from "@/screens/institution/InstitutionDetailSkeleton";

import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useAuthStore } from "@/stores/authStore";
import { useSelection } from "@/hooks/useSelection";
import { useInstitutionDetail } from "@/hooks/queries/useInstitutionDetail";
import { showToast } from "@/stores/toastStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AverageRatings {
  averageGeneralRating: number;
  averageQualityRating: number;
  averageFacilitiesRating: number;
  averageStudentLifeRating: number;
  totalReviews: number;
  star5: number;
  star4: number;
  star3: number;
  star2: number;
  star1: number;
}

const ZERO_AVERAGES: AverageRatings = {
  averageGeneralRating: 0,
  averageQualityRating: 0,
  averageFacilitiesRating: 0,
  averageStudentLifeRating: 0,
  totalReviews: 0,
  star5: 0,
  star4: 0,
  star3: 0,
  star2: 0,
  star1: 0,
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function InstitutionDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, lang, isRtl } = useCustomTranslation();
  const locale = (lang === "ar" ? "ar" : "en") as "en" | "ar";

  const { isLoggedIn } = useAuthStore();
  const { isFavorite, isCompared, toggleFavorite, toggleCompare, seedSelection } = useSelection();

  // Server state (React Query): cached per slug+locale, so a revisit renders at once.
  const {
    institution,
    academicData,
    nbPrograms,
    averages: averagesData,
    loading,
    notFound,
    refetchAll,
    refreshAverages,
  } = useInstitutionDetail(slug, locale);
  const averages: AverageRatings = averagesData ?? ZERO_AVERAGES;
  const [refreshing, setRefreshing] = useState(false);

  const reviewScrollRef = useRef<ScrollView>(null);

  // Seed favorite/compare state for the signed-in user (not server-cached data).
  useEffect(() => {
    if (institution) void seedSelection(["Institution", "Program"]);
  }, [institution, isLoggedIn, seedSelection]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setRefreshing(false);
    }
  };

  // ── Actions — H1 fix: use canonical selection hook ─────────────────────────

  const handleToggleFavorite = () => {
    if (!institution) return;
    toggleFavorite("Institution", institution.documentId);
  };

  const handleAddToCompare = () => {
    if (!institution) return;
    toggleCompare("Institution", institution.documentId);
  };

  const handleAddReviewPress = () => {
    // Scroll to reviews section
    reviewScrollRef.current?.scrollToEnd({ animated: true });
  };

  const handleReviewSubmitted = async () => {
    if (!institution) return;
    await refreshAverages();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <AppHeader title={t("institutions")} showBack />
        <InstitutionDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (notFound || !institution) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <AppHeader title={t("institutions")} showBack />
        <EmptyState
          title={t("notFound")}
          description={t("notFoundDesc")}
        />
      </SafeAreaView>
    );
  }

  const docId = institution.documentId;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <AppHeader
        title={institution.name || t("institutions")}
        showBack
      />

      <ScrollView
        ref={reviewScrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero */}
        <InstitutionHeroSection
          institution={institution}
          rating={averages.averageGeneralRating}
          nbReviews={averages.totalReviews}
          nbPrograms={nbPrograms}
          isFavorite={isFavorite("Institution", docId)}
          isCompared={isCompared("Institution", docId)}
          isLoggedIn={isLoggedIn}
          onToggleFavorite={handleToggleFavorite}
          onAddToCompare={handleAddToCompare}
          onAddReviewPress={handleAddReviewPress}
        />

        <View className="gap-6 pt-4">
          {/* 2. Overview */}
          <InstitutionOverviewSection institution={institution} />

          {/* 3. Academic Programs */}
          <InstitutionAcademicSection
            academicData={academicData}
            institutionSlug={slug ?? ""}
            locale={locale}
            isLoggedIn={isLoggedIn}
          />

          {/* 4. Tuition Fees */}
          <InstitutionTuitionSection institution={institution} />

          {/* 5. Reviews */}
          <InstitutionReviewsSection
            institutionDocumentId={docId}
            institutionSlug={slug ?? ""}
            averages={averages}
            locale={locale}
            isLoggedIn={isLoggedIn}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </View>
      </ScrollView>

      {/* Sticky compare bars — Institution and Program */}
      <CompareBar itemType="Institution" />
      <CompareBar itemType="Program" />
    </SafeAreaView>
  );
}
