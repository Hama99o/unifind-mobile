/**
 * InstitutionsFavoriteTab — Institutions sub-tab of Favorites.
 * Loads favorited institutions from Node/Strapi + avg ratings, renders InstitutionCard.
 *
 * §2A: toggle/compare delegated to useSelection (canonical toast keys).
 * §2B: loading/error/empty state managed by useAsyncResource + AsyncBoundary.
 */

import { useState, useCallback, useEffect } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { AsyncBoundary } from "@/components/shared/AsyncBoundary";
import { InstitutionCard } from "@/components/cards/InstitutionCard";
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
import { catalogItemsApi, type CatalogInstitution } from "@/api/catalogItemsApi";
import { router } from "expo-router";
import { showToast } from "@/stores/toastStore";
import { formatInstitutionTuition, formatLocation } from "@/utils/catalogFormat";
import { injectAvgRatings } from "@/utils/ratings";

type InstitutionWithRating = CatalogInstitution & { ratingStars: number };

export function InstitutionsFavoriteTab() {
  const { t, lang } = useCustomTranslation();
  const { formatCurrency } = useLocalization();
  const user = useAuthStore((s) => s.user);
  // H1/H2 fix: use canonical userID (not raw sub)
  const userId = user?.userID ?? "";
  const locale = (lang === "ar" ? "ar" : "en") as "en" | "ar";

  const { setFavorites } = useFavoritesStore();
  const { setCompared, isCompared } = useCompareStore();
  // §2A: canonical toggle hook — consistent toast keys (failedUpdateFavorite, compareInstitutionsLimit, failedUpdateComparison)
  const selection = useSelection();

  // §2B: useAsyncResource drives loading/error/reload.
  // Loader throws with translated message so AsyncBoundary renders it directly.
  const { data, loading, error, reload } = useAsyncResource<InstitutionWithRating[]>(
    async () => {
      if (!userId) return [];
      try {
        const ids = await favoritesApi.getFavoriteIds(userId, "Institution");
        setFavorites("Institution", ids);
        if (ids.length === 0) return [];
        const rawData = await catalogItemsApi.getInstitutionsByDocumentIds(ids, locale);
        const withRatings = await injectAvgRatings(rawData, (inst) => String(inst.id));
        const compareIds = await comparesApi.getCompareIds("Institution");
        setCompared("Institution", compareIds);
        return withRatings;
      } catch {
        throw new Error(t("profileLoadError"));
      }
    },
    [userId, locale]
  );

  // Track locally-removed rows for immediate row-disappear UX on un-favorite.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // Clear removed IDs whenever fresh data arrives from the server.
  useEffect(() => {
    if (data !== null) setRemovedIds(new Set());
  }, [data]);

  const visible = data?.filter((inst) => !removedIds.has(inst.documentId)) ?? [];

  // §2A: remove row locally, then delegate store/API/toast to canonical hook.
  const handleToggleFavorite = useCallback((documentId: string) => {
    setRemovedIds((prev) => new Set([...prev, documentId]));
    selection.toggleFavorite("Institution", documentId);
  }, [selection]);

  // §2A: compare toggle — fully delegated (compareInstitutionsLimit / failedUpdateComparison)
  const handleAddToCompare = useCallback((documentId: string) => {
    selection.toggleCompare("Institution", documentId);
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
          <EmptyState title={t("favorites.noInstitutions")} description={t("favorites.noInstitutionsDesc")} />
          <Button
            label={t("favorites.exploreInstitutions")}
            action="primary"
            variant="outline"
            onPress={() => showToast(t("common.comingSoon"))}
          />
        </View>
      }
    >
      <>
        {visible.map((inst) => {
          // H2 fix: use catalogFormat helpers (i18n currency, zero-guard, no hardcoded "$")
          const location = formatLocation(
            inst.mainLocation?.city?.name,
            inst.mainLocation?.country?.name
          ) || "-";
          const fees = formatInstitutionTuition(inst.tuition ?? [], formatCurrency) || "-";

          return (
            <InstitutionCard
              key={inst.documentId}
              documentId={inst.documentId}
              name={inst.name}
              type={inst.type}
              location={location}
              description={catalogItemsApi.extractDescription(inst.about)}
              logoSrc={inst.logo?.url}
              coverSrc={inst.photoCover?.url}
              fees={fees}
              rating={inst.ratingStars}
              isFavorite
              isCompared={isCompared("Institution", inst.documentId)}
              onToggleFavorite={() => handleToggleFavorite(inst.documentId)}
              onAddToCompare={() => handleAddToCompare(inst.documentId)}
              onPrimaryClick={() => router.push(`/(main)/institutions/${inst.slug}` as never)}
              compareLabel={t("btnAddToCompare")}
              primaryLabel={t("favorites.checkInstitution")}
            />
          );
        })}
      </>
    </AsyncBoundary>
  );
}
