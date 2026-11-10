/**
 * OfferingsFavoriteTab — Offerings sub-tab of Favorites.
 * Loads favorited offerings from Node/Strapi (only shows items present in both).
 *
 * §2A: favorite toggle delegated to useSelection (canonical toast key: failedUpdateFavorite).
 * §2B: loading/error/empty state managed by useAsyncResource + AsyncBoundary.
 */

import { useState, useCallback, useEffect } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { AsyncBoundary } from "@/components/shared/AsyncBoundary";
import { OfferingCard } from "@/components/cards/OfferingCard";
import { CardSkeleton } from "@/screens/profile/tabs/favorites/CardSkeleton";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useAuthStore } from "@/stores/authStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useSelection } from "@/hooks/useSelection";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { favoritesApi } from "@/api/favoritesApi";
import { bookingsApi } from "@/api/bookingsApi";
import { catalogItemsApi, type CatalogOffering } from "@/api/catalogItemsApi";
import { mergeOfferingsByContentId } from "@/utils/offeringMerge";
import { showToast } from "@/stores/toastStore";

type MergedOffering = CatalogOffering & { sessionDuration?: number };

export function OfferingsFavoriteTab() {
  const { t, lang } = useCustomTranslation();
  const user = useAuthStore((s) => s.user);
  // H1 fix: use canonical userID (not raw sub)
  const userId = user?.userID ?? "";
  const locale = (lang === "ar" ? "ar" : "en") as "en" | "ar";

  const { setFavorites } = useFavoritesStore();
  // §2A: canonical toggle hook — consistent toast key (failedUpdateFavorite)
  const selection = useSelection();

  // §2B: useAsyncResource drives loading/error/reload.
  // Loader throws with translated message so AsyncBoundary renders it directly.
  const { data, loading, error, reload } = useAsyncResource<MergedOffering[]>(
    ["favorites", "Offering", locale],
    async () => {
      if (!userId) return [];
      try {
        const ids = await favoritesApi.getFavoriteIds(userId, "Offering");
        setFavorites("Offering", ids);
        if (ids.length === 0) return [];
        const strapiData = await catalogItemsApi.getOfferingsByIds(ids, locale);
        const nodeData = await bookingsApi.getOfferingNodeData(ids);
        const merged = mergeOfferingsByContentId(
          strapiData,
          nodeData,
          (_s, n) => ({ sessionDuration: n.sessionDuration as number | undefined })
        );
        return merged;
      } catch {
        throw new Error(t("profileLoadError"));
      }
    }
  );

  // Track locally-removed rows for immediate row-disappear UX on un-favorite.
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());

  // Clear removed IDs whenever fresh data arrives from the server.
  useEffect(() => {
    if (data !== null) setRemovedIds(new Set());
  }, [data]);

  const visible = data?.filter((o) => !removedIds.has(o.id)) ?? [];

  // §2A: remove row locally, then delegate store/API/toast to canonical hook.
  const handleToggleFavorite = useCallback((id: number) => {
    setRemovedIds((prev) => new Set([...prev, id]));
    selection.toggleFavorite("Offering", String(id));
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
          <EmptyState title={t("favorites.noOfferings")} description={t("favorites.noOfferingsDesc")} />
          <Button
            label={t("favorites.exploreOfferings")}
            action="primary"
            variant="outline"
            onPress={() => router.push("/(main)/find/offerings" as never)}
          />
        </View>
      }
    >
      <>
        {visible.map((off) => (
          <OfferingCard
            key={off.id}
            id={String(off.id)}
            imageSrc={off.image?.url ?? null}
            title={off.title}
            description={catalogItemsApi.extractDescription(off.description)}
            city={off.location?.city?.name}
            price={typeof off.price === "number" ? off.price : null}
            sessionDuration={off.sessionDuration ?? null}
            isFavorite
            onToggleFavorite={() => handleToggleFavorite(off.id)}
            onPrimaryClick={() => {
              if (off.slug) {
                router.push(`/(main)/offerings/${off.slug}` as never);
              } else {
                showToast(`${off.title} · ${t("common.comingSoon")}`);
              }
            }}
            primaryLabel={t("favorites.checkOffering")}
          />
        ))}
      </>
    </AsyncBoundary>
  );
}
