/**
 * FindInstitutionsScreen — Find Institutions list screen.
 * Web parity: /[locale]/find/institutions
 *
 * Wires together:
 *   - UniversalList<InstitutionListItem> with institution filter config
 *   - InstitutionCard (cover, ranking, favorite, compare, rating, fees, location)
 *   - CompareBar (sticky bottom)
 *   - SubNavBar (Programs | Institutions | Offerings) — driven by parent FindScreen
 *   - Deep-link query params (level, field, location) pre-applied as filters
 *   - Auth-gated favorite + compare actions
 *   - Rating injection via reviewsApi
 *   - Location raw map for filter param translation
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { UniversalList } from "@/components/common/UniversalList";
import { CompareBar } from "@/components/common/CompareBar";
import { InstitutionCard } from "@/components/cards/InstitutionCard";
import { ListSkeleton } from "@/components/common/ListSkeleton";
import { router } from "expo-router";

import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import { useSelection } from "@/hooks/useSelection";
import { showToast } from "@/stores/toastStore";
import { extractPlainText } from "@/api/catalog";
import { institutionsApi } from "@/api/institutionsApi";
import { buildInstitutionFilterConfig } from "@/config/institutionFilters";
import { injectAvgRatings } from "@/utils/ratings";
import { useInstitutionsData } from "@/screens/find/useInstitutionsData";
import { formatInstitutionTuition, formatLocation } from "@/utils/catalogFormat";
import type { LocationRawItem } from "@/screens/find/useInstitutionsData";

import type { FilterValues, FilterConfig } from "@/components/common/FilterDrawer";
import type { InstitutionListItem } from "@/api/institutionsApi";

interface FindInstitutionsScreenProps {
  /** Optional SubNavBar rendered above the list (provided by parent FindScreen) */
  subNav?: React.ReactNode;
}

export default function FindInstitutionsScreen({ subNav: subNavProp }: FindInstitutionsScreenProps = {}) {
  const { t, lang } = useCustomTranslation();
  const { formatCurrency } = useLocalization();
  const params = useLocalSearchParams<{ level?: string; field?: string; location?: string }>();

  const { buildFilterParams } = useInstitutionsData();
  // H1 fix: use canonical selection hook (replaces per-screen copy-pasted handlers)
  const { isFavorite, isCompared, toggleFavorite, toggleCompare, seedSelection } = useSelection();

  // ── Location raw map (needed for location filter param building) ─────────────
  const [locationRawMap, setLocationRawMap] = useState<LocationRawItem[]>([]);

  // ── Filter config (memoized, updated when lang changes) ─────────────────────
  const filterConfig: FilterConfig[] = useMemo(
    () => buildInstitutionFilterConfig(t, lang as "en" | "ar"),
    [t, lang]
  );

  // ── Deep-link initial filters ────────────────────────────────────────────────
  // We must match incoming location raw-city param to "gov,city" filter value.
  // Degree/field matching happens against the filter option values (comma-separated ids).
  const [initialFilters, setInitialFilters] = useState<FilterValues | undefined>(undefined);
  const [filterDataLoaded, setFilterDataLoaded] = useState(false);
  const [filterDataLoadAttempted, setFilterDataLoadAttempted] = useState(false);

  // Load location raw map once, then build initial filters from params
  useEffect(() => {
    if (filterDataLoadAttempted) return;
    setFilterDataLoadAttempted(true);

    const load = async () => {
      try {
        const locs = await institutionsApi.fetchLocationFilterOptions(lang as "en" | "ar");
        setLocationRawMap(locs);

        // Build initial filters from deep-link params
        const newFilters: FilterValues = {};

        if (params.location) {
          // Match incoming city name to "gov,city" value
          const matched = locs.filter(
            (loc) => loc.label.toLowerCase() === params.location!.toLowerCase()
          );
          if (matched.length > 0) {
            newFilters.location = matched.map((m) => m.value);
          }
        }

        // Degree and field params are matched against filter option values.
        // Since options are fetched async in the FilterDrawer, we resolve them here.
        if (params.level) {
          const degreeOpts = await institutionsApi.fetchDegreeFilterOptions(lang as "en" | "ar");
          const matched = degreeOpts.find(
            (d) => d.degree.title.toLowerCase() === params.level!.toLowerCase()
          );
          if (matched) {
            newFilters.degreeLevel = [matched.institutions];
          }
        }

        if (params.field) {
          const fieldOpts = await institutionsApi.fetchFieldFilterOptions(lang as "en" | "ar");
          const matched = fieldOpts.find(
            (f) => f.fieldOfStudy.name.toLowerCase() === params.field!.toLowerCase()
          );
          if (matched) {
            newFilters.fieldOfStudy = [matched.institutions];
          }
        }

        if (Object.keys(newFilters).length > 0) {
          setInitialFilters(newFilters);
        }
      } catch {
        // silently ignore filter pre-load errors
      } finally {
        setFilterDataLoaded(true);
      }
    };

    load();
  }, [lang, params.level, params.field, params.location]);

  // ── Seed user data (favorites + compares) ───────────────────────────────────
  useEffect(() => {
    seedSelection(["Institution"]);
  }, [seedSelection]);

  // ── fetchPage wrapper (injects locationRawMap for filter translation) ────────
  const fetchPage = useCallback(
    async (params2: {
      page: number;
      search: string;
      filters: FilterValues;
      sort: string;
    }) => {
      // Re-build filter params with real location raw map
      const filterApiParams = buildFilterParams(params2.filters, locationRawMap);

      const result = await institutionsApi.list({
        locale: lang as "en" | "ar",
        page: params2.page,
        pageSize: 6,
        search: params2.search,
        sort: params2.sort,
        idIn: filterApiParams.idIn,
        tuitionMin: filterApiParams.tuitionMin,
        tuitionMax: filterApiParams.tuitionMax,
      });

      // Inject rating per item
      const itemsWithRating = await injectAvgRatings(
        result.items,
        (inst) => String(inst.id)
      );

      return { ...result, items: itemsWithRating };
    },
    [lang, locationRawMap, buildFilterParams]
  );

  // ── Card renderer ────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    (inst: InstitutionListItem) => {
      // H2 fix: use catalogFormat helpers (i18n currency, zero-guard, no hardcoded "$")
      const fees = formatInstitutionTuition(inst.tuition ?? [], formatCurrency) || "-";
      const location = formatLocation(
        inst.mainLocation?.city?.name,
        inst.mainLocation?.country?.name
      );

      const topRankings = (inst.ranking ?? [])
        .filter((r) => r.position && r.position > 0)
        .map((r) => ({
          position: r.position,
          rankingCategory: r.organizations?.[0]?.rankingCategory,
          name: r.name,
        }));

      const description = extractPlainText(inst.about);
      const docId = inst.documentId;

      return (
        <InstitutionCard
          key={docId}
          documentId={docId}
          name={inst.name || "-"}
          type={inst.acronym ?? undefined}
          location={location}
          description={description}
          logoSrc={inst.logo?.url}
          coverSrc={inst.photoCover?.url}
          fees={fees}
          rating={inst.ratingStars ?? 0}
          isFavorite={isFavorite("Institution", docId)}
          isCompared={isCompared("Institution", docId)}
          rankings={topRankings}
          onToggleFavorite={() => toggleFavorite("Institution", docId)}
          onAddToCompare={() => toggleCompare("Institution", docId)}
          onPrimaryClick={() =>
            router.push(`/(main)/institutions/${inst.slug}` as never)
          }
        />
      );
    },
    [isFavorite, isCompared, toggleFavorite, toggleCompare, t, formatCurrency]
  );

  // ── Sort options ─────────────────────────────────────────────────────────────
  const sortOptions = useMemo(
    () => [
      { key: "default", label: t("default") },
      { key: "tuition_asc", label: t("lowToHigh") },
      { key: "tuition_desc", label: t("highToLow") },
    ],
    [t]
  );

  // Wait for filter data before rendering (so initialFilters is ready)
  if (!filterDataLoaded && (params.level || params.field || params.location)) {
    return (
      <ScreenContainer>
        <View className="flex-1 pt-4">
          <ListSkeleton variant="institution" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <UniversalList<InstitutionListItem>
        config={{
          fetchPage,
          title: t("institutions"),
          searchPlaceholder: t("searchPlaceholder"),
          searchable: true,
          showResultsCount: true,
          sort: {
            options: sortOptions,
            default: "default",
          },
          filters: filterConfig,
          subNav: subNavProp,
          renderItem,
          keyExtractor: (item) => item.documentId,
          skeletonVariant: "institution",
          empty: {
            title: t("favorites.noInstitutions"),
            description: t("favorites.noInstitutionsDesc"),
          },
        }}
        initialFilters={initialFilters}
        stickyBottom={<CompareBar itemType="Institution" />}
      />
    </ScreenContainer>
  );
}
