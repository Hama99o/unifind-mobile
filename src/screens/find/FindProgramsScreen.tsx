/**
 * FindProgramsScreen — Find Programs list screen.
 * Web parity: /[locale]/find/programs
 *
 * Wires together:
 *   - UniversalList<ProgramListItem> with program filter config
 *   - ProgramCard (logo, title, university, description, degree, location,
 *                   duration, fees, language, favorite, compare, CTA)
 *   - CompareBar (sticky bottom)
 *   - SubNavBar (Programs | Institutions | Offerings) — driven by parent
 *   - Deep-link query params (level, field, location, search) pre-applied
 *   - Auth-gated favorite + compare actions
 *
 * SubNavBar is NOT rendered here — the parent FindScreen handles it.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { UniversalList } from "@/components/common/UniversalList";
import { CompareBar } from "@/components/common/CompareBar";
import { ListSkeleton } from "@/components/common/ListSkeleton";

import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useSelection } from "@/hooks/useSelection";
import { programsApi } from "@/api/programsApi";
import { programsFilterApi } from "@/api/programsFilterApi";
import { buildProgramFilterConfig } from "@/config/programFilters";
import { useProgramsData } from "@/screens/find/useProgramsData";
import { useProgramCardRenderer } from "@/screens/find/ProgramCardRenderer";

import type { FilterValues, FilterConfig } from "@/components/common/FilterDrawer";
import type { ProgramListItem } from "@/api/programsApi";
import type { ProgramLocationRaw } from "@/api/programsFilterApi";

interface Props {
  /** Optional SubNavBar slot rendered above the list */
  subNav?: React.ReactNode;
}

export default function FindProgramsScreen({ subNav }: Props) {
  const { t, lang } = useCustomTranslation();
  const params = useLocalSearchParams<{
    level?: string;
    field?: string;
    location?: string;
    search?: string;
  }>();

  const { buildFilterParams } = useProgramsData();
  // H1 fix: use canonical selection hook
  const { isFavorite, isCompared, toggleFavorite: _toggleFav, toggleCompare: _toggleCmp, seedSelection } = useSelection();

  // ── Location raw map for filter param building ─────────────────────────────
  const [locationRawMap, setLocationRawMap] = useState<ProgramLocationRaw[]>([]);

  // ── Filter config ──────────────────────────────────────────────────────────
  const filterConfig: FilterConfig[] = useMemo(
    () => buildProgramFilterConfig(t, lang as "en" | "ar"),
    [t, lang]
  );

  // ── Deep-link initial filters ──────────────────────────────────────────────
  const [initialFilters, setInitialFilters] = useState<FilterValues | undefined>(undefined);
  const [filterDataLoaded, setFilterDataLoaded] = useState(false);
  const [filterDataLoadAttempted, setFilterDataLoadAttempted] = useState(false);

  useEffect(() => {
    if (filterDataLoadAttempted) return;
    setFilterDataLoadAttempted(true);

    const load = async () => {
      try {
        const locs = await programsFilterApi.fetchLocationOptions(lang as "en" | "ar");
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
          const degreeOpts = await programsFilterApi.fetchDegreeOptions(lang as "en" | "ar");
          const matched = degreeOpts.find(
            (d) => d.label.toLowerCase() === params.level!.toLowerCase()
          );
          if (matched) {
            newFilters.degree = [matched.value];
          }
        }

        if (params.field) {
          const fieldOpts = await programsFilterApi.fetchFieldOptions(lang as "en" | "ar");
          const matched = fieldOpts.find(
            (f) => f.label.toLowerCase() === params.field!.toLowerCase()
          );
          if (matched) {
            newFilters.fieldOfStudy = [matched.value];
          }
        }

        if (Object.keys(newFilters).length > 0) {
          setInitialFilters(newFilters);
        }
      } catch {
        // silently ignore — list still renders without pre-filters
      } finally {
        setFilterDataLoaded(true);
      }
    };

    load();
  }, [lang, params.level, params.field, params.location]);

  // ── Seed user data (favorites + compares) ─────────────────────────────────
  useEffect(() => {
    seedSelection(["Program"]);
  }, [seedSelection]);

  // ── fetchPage wrapper ──────────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (callParams: {
      page: number;
      search: string;
      filters: FilterValues;
      sort: string;
    }) => {
      const fp = buildFilterParams(callParams.filters, locationRawMap);

      const result = await programsApi.list({
        locale: lang as "en" | "ar",
        page: callParams.page,
        pageSize: 5,
        search: callParams.search,
        sort: callParams.sort,
        degreeIds: fp.degreeIds,
        fieldOfStudyIds: fp.fieldOfStudyIds,
        locationIds: fp.locationIds,
        nbOfYearsMins: fp.nbOfYearsMins,
        nbOfYearsMaxs: fp.nbOfYearsMaxs,
        languageIds: fp.languageIds,
        tuitionMin: fp.tuitionMin,
        tuitionMax: fp.tuitionMax,
      });

      // Client-side post-filter on tuition when range is active
      // (tuitionMin/Max are only defined when the user moved the slider).
      // Mirrors web filteredByTuition logic for institution.tuition[0].
      const tuitionRangeActive =
        fp.tuitionMin !== undefined && fp.tuitionMax !== undefined;

      const filteredItems = tuitionRangeActive
        ? result.items.filter((prog) => {
            const t0 = prog.institution?.tuition?.[0];
            if (!t0) return false;
            const mn = t0.minTuition ?? 0;
            const mx = t0.maxTuition ?? 0;
            return mn >= fp.tuitionMin! && mx <= fp.tuitionMax!;
          })
        : result.items;

      return { ...result, items: filteredItems };
    },
    [lang, locationRawMap, buildFilterParams]
  );

  // ── Card renderer ──────────────────────────────────────────────────────────
  // Adapt useSelection's (type, id) signature to the renderer's (prog) signature
  const renderItem = useProgramCardRenderer({
    isFavorite: (docId: string) => isFavorite("Program", docId),
    isCompared: (docId: string) => isCompared("Program", docId),
    toggleFavorite: (prog: ProgramListItem) => _toggleFav("Program", prog.documentId),
    toggleCompare: (prog: ProgramListItem) => _toggleCmp("Program", prog.documentId),
  });

  // ── Sort options ───────────────────────────────────────────────────────────
  const sortOptions = useMemo(
    () => [
      { key: "default", label: t("default") },
      { key: "tuition_asc", label: t("lowToHigh") },
      { key: "tuition_desc", label: t("highToLow") },
    ],
    [t]
  );

  // Wait for filter data before rendering when deep-link params present
  if (!filterDataLoaded && (params.level || params.field || params.location)) {
    return (
      <ScreenContainer>
        <View className="flex-1 pt-4">
          <ListSkeleton variant="program" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <UniversalList<ProgramListItem>
        config={{
          fetchPage,
          title: t("programs"),
          searchPlaceholder: t("searchProgramsPlaceholder"),
          searchable: true,
          showResultsCount: true,
          sort: {
            options: sortOptions,
            default: "default",
          },
          filters: filterConfig,
          subNav,
          renderItem,
          keyExtractor: (item) => item.documentId,
          skeletonVariant: "program",
          empty: {
            title: t("favorites.noPrograms"),
            description: t("favorites.noProgramsDesc"),
          },
        }}
        initialFilters={initialFilters}
        initialSort={undefined}
        stickyBottom={<CompareBar itemType="Program" />}
      />
    </ScreenContainer>
  );
}
