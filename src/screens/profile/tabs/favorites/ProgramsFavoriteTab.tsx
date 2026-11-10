/**
 * ProgramsFavoriteTab — Programs sub-tab of Favorites.
 * Loads favorited programs from Node/Strapi, renders ProgramCard list.
 *
 * §2A: toggle/compare delegated to useSelection (canonical toast keys).
 * §2B: loading/error/empty state managed by useAsyncResource + AsyncBoundary.
 */

import { useState, useCallback, useEffect } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { AsyncBoundary } from "@/components/shared/AsyncBoundary";
import { ProgramCard } from "@/components/cards/ProgramCard";
import { CardSkeleton } from "@/screens/profile/tabs/favorites/CardSkeleton";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import { useAuthStore } from "@/stores/authStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useCompareStore } from "@/stores/compareStore";
import { useSelection } from "@/hooks/useSelection";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { favoritesApi } from "@/api/favoritesApi";
import { comparesApi } from "@/api/comparesApi";
import { catalogItemsApi, type CatalogProgram } from "@/api/catalogItemsApi";
import { showToast } from "@/stores/toastStore";
import {
  formatDuration,
  formatCampusLabel,
  formatLanguageLabel,
  formatTuitionRange,
} from "@/utils/catalogFormat";

export function ProgramsFavoriteTab() {
  const { t, lang } = useCustomTranslation();
  const { formatCurrency, formatNumber } = useLocalization();
  const user = useAuthStore((s) => s.user);
  // H2 fix: use canonical userID (not raw sub)
  const userId = user?.userID ?? "";
  const locale = (lang === "ar" ? "ar" : "en") as "en" | "ar";

  const { setFavorites } = useFavoritesStore();
  const { setCompared, isCompared } = useCompareStore();
  // §2A: canonical toggle hook — consistent toast keys (failedUpdateFavorite, compareProgramsLimit, failedUpdateComparison)
  const selection = useSelection();

  // §2B: useAsyncResource drives loading/error/reload.
  // Loader throws with translated message so AsyncBoundary renders it directly.
  const { data, loading, error, reload } = useAsyncResource<CatalogProgram[]>(
    ["favorites", "Program", locale],
    async () => {
      if (!userId) return [];
      try {
        const ids = await favoritesApi.getFavoriteIds(userId, "Program");
        setFavorites("Program", ids);
        if (ids.length === 0) return [];
        const programs = await catalogItemsApi.getProgramsByDocumentIds(ids, locale);
        const compareIds = await comparesApi.getCompareIds("Program");
        setCompared("Program", compareIds);
        return programs;
      } catch {
        throw new Error(t("profileLoadError"));
      }
    }
  );

  // Track locally-removed rows so the row disappears immediately on un-favorite,
  // without waiting for the next server reload.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // Clear removed IDs whenever fresh data arrives from the server.
  useEffect(() => {
    if (data !== null) setRemovedIds(new Set());
  }, [data]);

  const visible = data?.filter((p) => !removedIds.has(p.documentId)) ?? [];

  // §2A: remove row locally, then delegate store/API/toast to canonical hook.
  const handleToggleFavorite = useCallback((documentId: string) => {
    setRemovedIds((prev) => new Set([...prev, documentId]));
    selection.toggleFavorite("Program", documentId);
  }, [selection]);

  // §2A: compare toggle — fully delegated (compareProgramsLimit / failedUpdateComparison)
  const handleAddToCompare = useCallback((documentId: string) => {
    selection.toggleCompare("Program", documentId);
  }, [selection]);

  return (
    <AsyncBoundary
      loading={loading}
      error={error}
      onRetry={reload}
      isEmpty={visible.length === 0}
      skeleton={<>{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</>}
      empty={
        <View className="gap-4 py-6">
          <EmptyState title={t("favorites.noPrograms")} description={t("favorites.noProgramsDesc")} />
          <Button
            label={t("favorites.explorePrograms")}
            action="primary"
            variant="outline"
            onPress={() => showToast(t("common.comingSoon"))}
          />
        </View>
      }
    >
      <>
        {visible.map((prog) => {
          // H2 fix: use catalogFormat helpers (i18n, zero-guard, formatCurrency)
          const locationLabel = formatCampusLabel(prog.campus, { t, formatNumber }) || "-";
          const langLabel = formatLanguageLabel(prog.languages, { t, formatNumber }) || "-";
          const duration = formatDuration(prog.nbOfYears, t) || "-";
          const tuition = prog.institution?.tuition?.[0];
          const fees = tuition ? (formatTuitionRange(tuition, formatCurrency) || "-") : "-";

          return (
            <ProgramCard
              key={prog.documentId}
              documentId={prog.documentId}
              logoSrc={prog.institution?.logo?.url}
              programTitle={prog.name}
              universityName={prog.institution?.name ?? "-"}
              description={catalogItemsApi.extractDescription(prog.about)}
              location={locationLabel}
              duration={duration}
              degree={prog.degree?.title ?? "-"}
              fees={fees}
              language={langLabel}
              isFavorite
              isCompared={isCompared("Program", prog.documentId)}
              onToggleFavorite={() => handleToggleFavorite(prog.documentId)}
              onAddToCompare={() => handleAddToCompare(prog.documentId)}
              onPrimaryClick={() => showToast(`${prog.name} · ${t("common.comingSoon")}`)}
              compareLabel={t("btnAddToCompare")}
              primaryLabel={t("favorites.checkProgram")}
            />
          );
        })}
      </>
    </AsyncBoundary>
  );
}
