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
 *
 * The AppHeader is NOT rendered here — the parent FindScreen provides a cohesive
 * header (back button + title + SubNavBar pill control) via the subNav prop.
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
  /** Cohesive header slot (back + title + SubNavBar) from parent FindScreen */
  subNav?: React.ReactNode;
  /** Embedded under FindScreen (fixed header): render the list directly, no
   *  ScreenContainer wrapper and no in-list header. */
  embedded?: boolean;
}

export default function FindInstitutionsScreen({ subNav: subNavProp, embedded }: FindInstitutionsScreenProps = {}) {
  const { t, lang } = useCustomTranslation();
  const { formatCurrency } = useLocalization();
  const params = useLocalSearchParams<{ level?: string; field?: string; location?: string }>();

  const { buildFilterParams } = useInstitutionsData();
  const { isFavorite, isCompared, toggleFavorite, toggleCompare, seedSelection } = useSelection();

  // ── Location raw map ─────────────────────────────────────────────────────────
  const [locationRawMap, setLocationRawMap] = useState<LocationRawItem[]>([]);

  // ── Filter config ────────────────────────────────────────────────────────────
  const filterConfig: FilterConfig[] = useMemo(
    () => buildInstitutionFilterConfig(t, lang as "en" | "ar"),
    [t, lang]
  );

  // ── Deep-link initial filters ────────────────────────────────────────────────
  const [initialFilters, setInitialFilters] = useState<FilterValues | undefined>(undefined);
  const [filterDataLoaded, setFilterDataLoaded] = useState(false);
  const [filterDataLoadAttempted, setFilterDataLoadAttempted] = useState(false);

  useEffect(() => {
    if (filterDataLoadAttempted) return;
    setFilterDataLoadAttempted(true);

    const load = async () => {
      try {
        const locs = await institutionsApi.fetchLocationFilterOptions(lang as "en" | "ar");
        setLocationRawMap(locs);

        const newFilters: FilterValues = {};

        if (params.location) {
          const matched = locs.filter(
            (loc) => loc.label.toLowerCase() === params.location!.toLowerCase()
          );
          if (matched.length > 0) {
            newFilters.location = matched.map((m) => m.value);
          }
        }

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

  // ── fetchPage wrapper ────────────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (params2: {
      page: number;
      search: string;
      filters: FilterValues;
      sort: string;
    }) => {
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

  // Show skeleton while filter data loads
  if (!filterDataLoaded && (params.level || params.field || params.location)) {
    const skel = (
      <View className="flex-1 pt-4">
        <ListSkeleton variant="institution" />
      </View>
    );
    return embedded ? skel : (
      <ScreenContainer>
        {subNavProp && <View>{subNavProp}</View>}
        {skel}
      </ScreenContainer>
    );
  }

  const list = (
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
        subNav: embedded ? undefined : subNavProp,
        renderItem,
        keyExtractor: (item) => item.documentId,
        skeletonVariant: "institution",
        empty: {
          title: t("common.noResults"),
          description: t("common.noResultsDesc"),
        },
      }}
      initialFilters={initialFilters}
      stickyBottom={<CompareBar itemType="Institution" />}
    />
  );

  return embedded ? list : <ScreenContainer>{list}</ScreenContainer>;
}
