/**
 * InstitutionsCompareTab — Institutions sub-tab of Comparisons.
 * Fetches compare IDs from Node API, then institutions from Strapi.
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
import { showToast } from "@/stores/toastStore";
import { router } from "expo-router";
import { formatInstitutionTuition, formatLocation } from "@/utils/catalogFormat";

export function InstitutionsCompareTab() {
  const { t, lang } = useCustomTranslation();
  const { formatCurrency } = useLocalization();
  const locale = (lang === "ar" ? "ar" : "en") as "en" | "ar";
  const { setCompared, removeCompare } = useCompareStore();

  // §2B: useAsyncResource drives loading/error/reload.
  const { data, loading, error, reload } = useAsyncResource<Record<string, string>[]>(
    async () => {
      try {
        const ids = await comparesApi.getCompareIds("Institution");
        setCompared("Institution", ids);
        if (!ids.length) return [];

        const institutions = await catalogItemsApi.getInstitutionsByIds(ids, locale);

        return institutions.map((inst) => {
          // H2 fix: use catalogFormat helpers (i18n currency, zero-guard, no hardcoded "$")
          const location = formatLocation(
            inst.mainLocation?.city?.name,
            inst.mainLocation?.country?.name
          ) || "-";

          const ranking = inst.ranking?.length
            ? inst.ranking
                .map((r) => {
                  const cat = r.organizations?.[0]?.rankingCategory;
                  return cat && r.position ? `${cat}: ${r.position}` : null;
                })
                .filter(Boolean)
                .join(", ")
            : "-";

          const tags = inst.tags?.length
            ? inst.tags.map((tg) => tg.name).join(", ")
            : "-";

          // H2 fix: formatInstitutionTuition handles zero-guard + i18n currency
          const tuition = formatInstitutionTuition(inst.tuition ?? [], formatCurrency) || "-";

          const base: Record<string, string> = {
            __id: String(inst.id),
            __documentId: inst.documentId,
            __name: inst.name,
            __slug: inst.slug,
            acronym: inst.acronym ?? "-",
            location,
            foundationYear: inst.foundationYear ? String(inst.foundationYear) : "-",
            website: inst.website ?? "-",
            email: inst.email ?? "-",
            phone: inst.phone ?? "-",
            ranking,
            tuition,
            tags,
          };

          inst.institutionInfo?.forEach((info) => { base[info.type.type] = info.info; });

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
          removeCompare("Institution", item.__documentId);
          setRemovedDocIds((prev) => new Set([...prev, item.__documentId]));
          try {
            await comparesApi.toggleCompare(item.__id, "Institution");
          } catch {
            showToast(t("profileSaveError"));
            reload();
          }
        },
      },
    ]);
  }, [t, removeCompare, reload]);

  const INST_ATTRS: CompareAttribute[] = [
    { key: "acronym", label: t("acronym") },
    { key: "location", label: t("comparisons.location") },
    { key: "foundationYear", label: t("foundationYear") },
    { key: "website", label: t("website") },
    { key: "email", label: t("emailAddress") },
    { key: "phone", label: t("phone") },
    { key: "ranking", label: t("rankings") },
    { key: "tuition", label: t("tuition") },
    { key: "tags", label: t("tags") },
  ];

  const dynamicAttrs: CompareAttribute[] = rows.length
    ? Object.keys(rows[0])
        .filter((k) => !k.startsWith("__") && !INST_ATTRS.find((a) => a.key === k))
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
          <EmptyState title={t("comparisons.noInstitutions")} description={t("comparisons.noInstitutionsDesc")} />
          <Button
            label={t("comparisons.exploreInstitutions")}
            action="primary"
            variant="outline"
            onPress={() => router.push("/(main)/find?find=institutions" as never)}
          />
        </View>
      }
    >
      <ComparisonTable
        attributes={[...INST_ATTRS, ...dynamicAttrs]}
        items={rows}
        onRemove={handleRemove}
        onViewMore={(item) => {
          if (item.__slug) router.push(`/(main)/institutions/${item.__slug}` as never);
          else showToast(`${item.__name} · ${t("common.comingSoon")}`);
        }}
      />
    </AsyncBoundary>
  );
}
