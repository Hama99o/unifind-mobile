/**
 * FindOfferingsScreen — Find Offerings list screen.
 * Web parity: /[locale]/find/offerings
 *
 * Two modes:
 *   A) Via FindScreen (Program Explorer > Offerings tab):
 *      - subNav prop provided (back + title + SubNavBar pill from FindScreen)
 *      - No AppHeader rendered here (parent already has it)
 *   B) Standalone from Growth Center hub (route /(main)/find/offerings):
 *      - No subNav prop → render its own AppHeader (back + title)
 *
 * Two-step fetch (exact web parity):
 *   1. Node GET /offering (paged, filters: category, fieldOfStudy intersection, price range)
 *   2. Strapi GET /api/offerings?filters[id][$in]=... (full card fields)
 *   3. Merge by offeringContentId === strapi.id
 *   4. Sort client-side (default=order asc, price_asc, price_desc)
 *   5. Ratings: N+1 parallel per page, login-gated (0 for anonymous)
 *
 * Filter config (3 filters):
 *   - category (multiSelect) → Node categoryId params
 *   - fieldOfStudy (multiSelect) → intersection of offering-id arrays
 *   - price (range) → Node price=min-max
 *
 * Auth-gated: favorite toggle only (no compare for offerings).
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { AppHeader } from "@/components/shared/AppHeader";
import { UniversalList } from "@/components/common/UniversalList";
import { OfferingCard } from "@/components/cards/OfferingCard";
import { ListSkeleton } from "@/components/common/ListSkeleton";

import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useAuthStore } from "@/stores/authStore";
import { useSelection } from "@/hooks/useSelection";
import { showToast } from "@/stores/toastStore";
import { extractPlainText } from "@/api/catalog";
import { router } from "expo-router";
import { offeringsApi } from "@/api/offeringsApi";
import { buildOfferingFilterConfig } from "@/config/offeringFilters";
import { useOfferingsData } from "@/screens/find/useOfferingsData";

import type { FilterValues, FilterConfig } from "@/components/common/FilterDrawer";
import type { MergedOffering } from "@/api/offeringsApi";

interface Props {
  /** Cohesive header slot (back + title + SubNavBar) from parent FindScreen.
   *  When absent the screen renders its own AppHeader (standalone Growth Center mode). */
  subNav?: React.ReactNode;
  /** Pre-applied initial filters from deep-link or hub navigation */
  initialFilters?: FilterValues;
  /** Growth Center bottom-tab root: shows all offerings directly (no pre-filter)
   *  and a title header with NO back button. */
  asTabRoot?: boolean;
  /** Embedded under FindScreen (fixed header): render the list directly, no
   *  ScreenContainer wrapper and no own header. */
  embedded?: boolean;
}

export default function FindOfferingsScreen({ subNav, initialFilters: initialFiltersProp, asTabRoot = false, embedded = false }: Props = {}) {
  const { t, lang } = useCustomTranslation();
  const params = useLocalSearchParams<{
    category?: string;
    field?: string;
    search?: string;
  }>();

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { buildParams } = useOfferingsData();
  const { isFavorite, toggleFavorite: _toggleFav, seedSelection } = useSelection();

  // ── Filter config ──────────────────────────────────────────────────────────
  const filterConfig: FilterConfig[] = useMemo(
    () => buildOfferingFilterConfig(t, lang as "en" | "ar"),
    [t, lang]
  );

  // ── Deep-link initial filters ──────────────────────────────────────────────
  const [initialFilters, setInitialFilters] = useState<FilterValues | undefined>(
    initialFiltersProp
  );
  const [filterDataLoaded, setFilterDataLoaded] = useState(false);

  useEffect(() => {
    if (initialFiltersProp) {
      setInitialFilters(initialFiltersProp);
      setFilterDataLoaded(true);
      return;
    }

    const build = async () => {
      try {
        const newFilters: FilterValues = {};
        if (params.category) {
          newFilters.category = [params.category];
        }
        if (params.field) {
          newFilters.fieldOfStudy = [params.field];
        }
        if (Object.keys(newFilters).length > 0) {
          setInitialFilters(newFilters);
        }
      } catch {
        // silently ignore
      } finally {
        setFilterDataLoaded(true);
      }
    };

    build();
  }, [params.category, params.field, initialFiltersProp]);

  // ── Seed user data ─────────────────────────────────────────────────────────
  useEffect(() => {
    seedSelection(["Offering"]);
  }, [seedSelection]);

  // ── fetchPage ──────────────────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (callParams: { page: number; search: string; filters: FilterValues; sort: string }) => {
      const { categoryIds, offeringContentIds, priceRange, fieldIntersectionEmpty } =
        buildParams(callParams.filters);

      if (fieldIntersectionEmpty) {
        return { items: [], page: callParams.page, pageCount: 0, total: 0 };
      }

      return offeringsApi.listPage(
        {
          page: callParams.page,
          locale: lang as "en" | "ar",
          categoryIds,
          offeringContentIds,
          priceRange,
        },
        isLoggedIn,
        callParams.sort
      );
    },
    [lang, isLoggedIn, buildParams]
  );

  // ── Card renderer ──────────────────────────────────────────────────────────
  const renderItem = useCallback(
    (item: MergedOffering) => {
      const specialists = (item.nodeData.eventTypes ?? []).map((et) => ({
        name: et.specialistName,
        avatarUrl: et.specialistPhoto,
      }));

      const city = item.location?.city?.name ?? "";
      const description = extractPlainText(item.description);

      return (
        <OfferingCard
          key={`${item.id}`}
          id={item.id}
          imageSrc={item.image?.url ?? null}
          title={item.title ?? "-"}
          description={description}
          city={city}
          sessionDuration={item.nodeData.sessionDuration ?? null}
          price={item.nodeData.minPrice ?? null}
          rating={item.ratingStars ?? 0}
          availableOnline={item.availableOnline ?? null}
          specialists={specialists}
          isFavorite={isFavorite("Offering", String(item.id))}
          onToggleFavorite={() => _toggleFav("Offering", String(item.id))}
          onPrimaryClick={() => {
            if (item.slug) {
              router.push(`/(main)/offerings/${item.slug}` as never);
            } else {
              showToast(t("common.comingSoon"));
            }
          }}
          primaryLabel={t("favorites.checkOffering")}
        />
      );
    },
    [isFavorite, _toggleFav, t]
  );

  // ── Sort options ───────────────────────────────────────────────────────────
  const sortOptions = useMemo(
    () => [
      { key: "default", label: t("default") },
      { key: "price_asc", label: t("offeringPriceLowHigh") },
      { key: "price_desc", label: t("offeringPriceHighLow") },
    ],
    [t]
  );

  // ── Client-side sort comparator ────────────────────────────────────────────
  const clientComparator = useCallback(
    (a: MergedOffering, b: MergedOffering, sort: string): number => {
      if (sort === "price_asc") {
        return (a.nodeData.minPrice ?? 0) - (b.nodeData.minPrice ?? 0);
      }
      if (sort === "price_desc") {
        return (b.nodeData.minPrice ?? 0) - (a.nodeData.minPrice ?? 0);
      }
      if (a.order == null) return 1;
      if (b.order == null) return -1;
      return a.order - b.order;
    },
    []
  );

  // Wait for filter data before rendering with deep-link params
  if (!filterDataLoaded && (params.category || params.field)) {
    const skel = (
      <View className="flex-1 pt-4">
        <ListSkeleton variant="offering" />
      </View>
    );
    if (embedded) return skel;
    return (
      <ScreenContainer>
        {subNav ? (
          <View>{subNav}</View>
        ) : (
          <AppHeader title={t("findOffering")} showBack={!asTabRoot} />
        )}
        {skel}
      </ScreenContainer>
    );
  }

  const list = (
    <UniversalList<MergedOffering>
      config={{
        fetchPage,
        clientComparator,
        title: t("findOffering"),
        searchPlaceholder: t("searchOfferings"),
        searchable: true,
        showResultsCount: true,
        sort: {
          options: sortOptions,
          default: "default",
        },
        filters: filterConfig,
        // FindScreen (embedded) renders the fixed header itself → no in-list header.
        subNav: embedded ? undefined : subNav,
        renderItem,
        keyExtractor: (item) => String(item.id),
        skeletonVariant: "offering",
        empty: {
          title: t("common.noResults"),
          description: t("common.noResultsDesc"),
        },
      }}
      initialFilters={initialFilters}
    />
  );

  // embedded (under FindScreen) → list only. Otherwise own header + container.
  if (embedded) return list;
  return (
    <ScreenContainer>
      {/* Tab root (Growth Center) = no back; pushed deep-link = back button. */}
      {!subNav && <AppHeader title={t("findOffering")} showBack={!asTabRoot} />}
      {list}
    </ScreenContainer>
  );
}
