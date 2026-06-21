/**
 * ProgramsCompareTab — Programs sub-tab of Comparisons.
 * Fetches compare IDs from Node API, then programs from Strapi.
 * Builds flat attribute rows and renders ComparisonTable.
 *
 * §2B: loading/error/empty state managed by useAsyncResource + AsyncBoundary.
 */

import { useState, useCallback, useEffect } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { AsyncBoundary } from "@/components/shared/AsyncBoundary";
import { confirmAlert } from "@/components/ui/alert-dialog";
import { ComparisonTable, TableSkeleton, type CompareAttribute } from "./ComparisonTable";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { useCompareStore } from "@/stores/compareStore";
import { comparesApi } from "@/api/comparesApi";
import { catalogItemsApi } from "@/api/catalogItemsApi";
import { injectAvgRatings } from "@/utils/ratings";
import { showToast } from "@/stores/toastStore";
import { router } from "expo-router";
import { formatTuitionRange, formatDuration, formatCredits } from "@/utils/catalogFormat";

export function ProgramsCompareTab() {
  const { t, lang } = useCustomTranslation();
  const { formatCurrency } = useLocalization();
  const locale = (lang === "ar" ? "ar" : "en") as "en" | "ar";
  const { setCompared, removeCompare } = useCompareStore();

  // §2B: useAsyncResource drives loading/error/reload.
  const { data, loading, error, reload } = useAsyncResource<Record<string, string>[]>(
    async () => {
      try {
        const ids = await comparesApi.getCompareIds("Program");
        setCompared("Program", ids);
        if (!ids.length) return [];

        const programs = await catalogItemsApi.getProgramsByIds(ids, locale);

        const withRatings = await injectAvgRatings(
          programs,
          (p) => p.institution?.id ? String(p.institution.id) : undefined
        );

        return withRatings.map((prog) => {
          const ratingStars = prog.ratingStars;
          const location =
            prog.campus?.[0]?.location?.district?.governorate ??
            prog.campus?.[0]?.location?.city?.name ??
            "-";
          // H2 fix: use catalogFormat helpers (i18n, zero-guard, no hardcoded "$")
          const duration = formatDuration(prog.nbOfYears, t) || "-";
          const credits = formatCredits(prog.nbOfCredits, t) || "-";
          const fees = formatTuitionRange(
            prog.institution?.tuition?.[0] ?? {},
            formatCurrency
          ) || "-";
          const specialisations =
            prog.specialisations?.map((s) => s.name).join(", ") || "-";

          const base: Record<string, string> = {
            __id: String(prog.id),
            __documentId: prog.documentId,
            __name: prog.name,
            __slug: prog.slug,
            __instSlug: prog.institution?.slug ?? "",
            uniName: prog.institution?.name ?? "-",
            rating: ratingStars ? `${ratingStars.toFixed(1)}/5` : "-",
            location,
            degree: prog.degree?.informationalText ?? prog.degree?.title ?? "-",
            department: prog.department ?? "-",
            duration,
            credits,
            fees,
            language: prog.languages?.[0]?.language ?? "-",
            test: t("comparisons.notRequired"),
            specialisations,
          };

          prog.programInfo?.forEach((info) => { base[info.type.type] = info.info; });
          prog.requirements?.forEach((req) => { base[req.title] = req.info; });

          return base;
        });
      } catch {
        throw new Error(t("profileLoadError"));
      }
    },
    [locale]
  );

  // Track locally-removed rows for immediate row-disappear on remove.
  const [removedDocIds, setRemovedDocIds] = useState<Set<string>>(new Set());

  // Clear removed IDs whenever fresh data arrives from the server.
  useEffect(() => {
    if (data !== null) setRemovedDocIds(new Set());
  }, [data]);

  const rows = data?.filter((r) => !removedDocIds.has(r.__documentId)) ?? [];

  const handleRemove = useCallback((item: Record<string, string>) => {
    confirmAlert(t("comparisons.removeTitle"), t("comparisons.removeMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          removeCompare("Program", item.__documentId);
          setRemovedDocIds((prev) => new Set([...prev, item.__documentId]));
          try {
            await comparesApi.toggleCompare(item.__id, "Program");
          } catch {
            showToast(t("profileSaveError"));
            reload();
          }
        },
      },
    ]);
  }, [t, removeCompare, reload]);

  const PROGRAM_ATTRS: CompareAttribute[] = [
    { key: "uniName", label: t("comparisons.university") },
    { key: "rating", label: t("comparisons.rating") },
    { key: "location", label: t("comparisons.location") },
    { key: "degree", label: t("comparisons.degree") },
    { key: "department", label: t("comparisons.department") },
    { key: "duration", label: t("comparisons.duration") },
    { key: "credits", label: t("comparisons.credits") },
    { key: "fees", label: t("comparisons.fees") },
    { key: "language", label: t("comparisons.language") },
    { key: "test", label: t("comparisons.test") },
    { key: "specialisations", label: t("specialisations") },
  ];

  const dynamicAttrs: CompareAttribute[] = rows.length
    ? Object.keys(rows[0])
        .filter((k) => !k.startsWith("__") && !PROGRAM_ATTRS.find((a) => a.key === k))
        .map((k) => ({
          key: k,
          label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        }))
    : [];

  return (
    <AsyncBoundary
      loading={loading}
      error={error}
      onRetry={reload}
      isEmpty={rows.length === 0}
      skeleton={<TableSkeleton />}
      empty={
        <View className="gap-4 py-6">
          <EmptyState title={t("comparisons.noPrograms")} description={t("comparisons.noProgramsDesc")} />
          <Button
            label={t("comparisons.explorePrograms")}
            action="primary"
            variant="outline"
            onPress={() => router.push("/(main)/find?find=programs" as never)}
          />
        </View>
      }
    >
      <ComparisonTable
        attributes={[...PROGRAM_ATTRS, ...dynamicAttrs]}
        items={rows}
        onRemove={handleRemove}
        onViewMore={(item) => {
          if (item.__instSlug && item.__slug) {
            router.push(
              `/(main)/institutions/${item.__instSlug}/programs/${item.__slug}` as never
            );
          } else {
            showToast(`${item.__name} · ${t("common.comingSoon")}`);
          }
        }}
      />
    </AsyncBoundary>
  );
}
