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

import { useCallback, useEffect, useState } from "react";
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
import { reviewsApi } from "@/api/reviewsApi";
import { programDetailApi } from "@/api/programDetailApi";
import type { ProgramListItem } from "@/api/programsApiTypes";

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

  const [program, setProgram] = useState<ProgramListItem | null>(null);
  const [rating, setRating] = useState(0);
  const [nbReviews, setNbReviews] = useState(0);
  const [related, setRelated] = useState<ProgramListItem[]>([]);
  const [relatedPage, setRelatedPage] = useState(1);
  const [relatedPageCount, setRelatedPageCount] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Load main program data ──────────────────────────────────────────────────

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!programSlug) return;
      if (!isRefresh) setLoading(true);

      try {
        const prog = await programDetailApi.getBySlug(programSlug, locale);
        if (!prog) {
          setNotFound(true);
          return;
        }
        setProgram(prog);

        // Load institution-level rating aggregate
        const institutionDocId = prog.institution?.documentId;
        if (institutionDocId) {
          const averages = await reviewsApi.getAllAverageRating(
            "Institution",
            institutionDocId
          );
          setRating(averages.averageGeneralRating);
          setNbReviews(averages.totalReviews);
        }

        // H1 fix: seed via canonical seedSelection (uses userID not raw sub)
        await seedSelection(["Program", "Institution"]);

        // Load related programs (by study field ids)
        const studyFieldIds: number[] = (prog.specialisations ?? [])
          .map((s) => s.studyField?.id)
          .filter((id): id is number => id != null);

        if (studyFieldIds.length > 0) {
          const relPage = await programDetailApi.getRelated(
            studyFieldIds,
            locale,
            1,
            5,
            programSlug
          );
          setRelated(relPage.items);
          setRelatedPage(1);
          setRelatedPageCount(relPage.pageCount);
        } else {
          setRelated([]);
          setRelatedPageCount(1);
        }
      } catch {
        if (!isRefresh) setNotFound(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [programSlug, locale, isLoggedIn, seedSelection]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    setRelated([]);
    setRelatedPage(1);
    setRelatedPageCount(1);
    loadData(true);
  };

  // ── Load more related programs ─────────────────────────────────────────────

  const handleLoadMoreRelated = useCallback(async () => {
    if (!program || isLoadingMore || relatedPage >= relatedPageCount) return;
    setIsLoadingMore(true);
    const nextPage = relatedPage + 1;
    try {
      const studyFieldIds: number[] = (program.specialisations ?? [])
        .map((s) => s.studyField?.id)
        .filter((id): id is number => id != null);

      if (studyFieldIds.length === 0) return;

      const relPage = await programDetailApi.getRelated(
        studyFieldIds,
        locale,
        nextPage,
        5,
        programSlug
      );
      setRelated((prev) => [...prev, ...relPage.items]);
      setRelatedPage(nextPage);
      setRelatedPageCount(relPage.pageCount);
    } catch {
      // Silently ignore load-more errors
    } finally {
      setIsLoadingMore(false);
    }
  }, [program, programSlug, locale, isLoadingMore, relatedPage, relatedPageCount]);

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
            hasMore={relatedPage < relatedPageCount}
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
