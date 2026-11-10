/**
 * ProgramDetailScreen — Web parity: /[locale]/program-explorer/institutions/[slug]/programs/[id]
 *
 * [id] in the web = program slug (not numeric id).
 *
 * Sections (in order):
 *   1. Hero — HeroDetailCard: logo, name, institution, rating, reviews,
 *             favorite, share, Know More (auth-gated), University Page, Add to Compare
 *   2. Quick-facts bar — 6 items (Main Campus, Degree, Years, Credits, Fees, Language)
 *   3. Program Overview — rich-text about, InfoCards, campus selector + MapPreview
 *   4. Admission Requirements — InfoCard grid
 *   5. Similar Programs — horizontal carousel by study field
 *
 * No Reviews section (web has none on program detail).
 * No Tuition section (web has none on program detail).
 *
 * Auth0: favorite + compare gated; Know More URL gated with Lock icon.
 * Two backends: Strapi (http) for program/related; Node (nodeApi) for rating/fav/compare.
 *
 * RTL-safe. Gluestack only. No hardcoded hex.
 */

import { useEffect, useState } from "react";
import { ScrollView, View, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/shared/AppHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CompareBar } from "@/components/common/CompareBar";
import { ProgramDetailSkeleton } from "@/screens/program/ProgramDetailSkeleton";
import { ProgramHeroSection } from "@/screens/program/ProgramHeroSection";
import { ProgramQuickFacts } from "@/screens/program/ProgramQuickFacts";
import { ProgramOverviewSection } from "@/screens/program/ProgramOverviewSection";
import { ProgramRequirementsSection } from "@/screens/program/ProgramRequirementsSection";
import { SimilarProgramsSection } from "@/screens/program/SimilarProgramsSection";

import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useAuthStore } from "@/stores/authStore";
import { useSelection } from "@/hooks/useSelection";
import { useProgramDetail } from "@/hooks/queries/useProgramDetail";

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProgramDetailScreen() {
  const { slug: _slug, programSlug } = useLocalSearchParams<{
    slug: string;
    programSlug: string;
  }>();

  const { t, lang } = useCustomTranslation();
  const locale = (lang === "ar" ? "ar" : "en") as "en" | "ar";

  const { isLoggedIn } = useAuthStore();
  // H1 fix: use canonical selection hook (eliminates useProgramSelection)
  const { isFavorite, isCompared, toggleFavorite, toggleCompare, seedSelection } = useSelection();

  // Server state (React Query): cached per slug+locale, so a revisit renders at once.
  const {
    program,
    loading,
    notFound,
    rating,
    nbReviews,
    related,
    hasMoreRelated,
    isLoadingMore,
    loadMoreRelated: handleLoadMoreRelated,
    refetchAll,
  } = useProgramDetail(programSlug, locale);
  const [refreshing, setRefreshing] = useState(false);

  // Seed favorite/compare state for the signed-in user (not server-cached data).
  useEffect(() => {
    if (program) void seedSelection(["Program", "Institution"]);
  }, [program, isLoggedIn, seedSelection]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setRefreshing(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <AppHeader title={t("programs")} showBack />
        <ProgramDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (notFound || !program) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <AppHeader title={t("programs")} showBack />
        <EmptyState
          title={t("notFound")}
          description={t("notFoundDesc")}
        />
      </SafeAreaView>
    );
  }

  const docId = program.documentId;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <AppHeader title={program.name || t("programs")} showBack />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero */}
        <ProgramHeroSection
          program={program}
          rating={rating}
          nbReviews={nbReviews}
          isFavorite={isFavorite("Program", docId)}
          isCompared={isCompared("Program", docId)}
          isLoggedIn={isLoggedIn}
          onToggleFavorite={() => toggleFavorite("Program", docId)}
          onAddToCompare={() => toggleCompare("Program", docId)}
        />

        {/* 2. Quick-facts */}
        <ProgramQuickFacts program={program} />

        <View className="gap-6 pt-4">
          {/* 3. Program Overview */}
          <ProgramOverviewSection program={program} />

          {/* 4. Admission Requirements */}
          <ProgramRequirementsSection program={program} />

          {/* 5. Similar Programs */}
          <SimilarProgramsSection
            programs={related}
            isLoggedIn={isLoggedIn}
            hasMore={hasMoreRelated}
            onLoadMore={handleLoadMoreRelated}
            isLoadingMore={isLoadingMore}
          />
        </View>
      </ScrollView>

      {/* Sticky compare bars */}
      <CompareBar itemType="Program" />
      <CompareBar itemType="Institution" />
    </SafeAreaView>
  );
}
