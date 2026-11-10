/**
 * ProgramCardRenderer — renders a ProgramListItem as a ProgramCard.
 * Split from FindProgramsScreen.tsx to keep that file under ~300 lines.
 * Used only by FindProgramsScreen; not a general-purpose component.
 */

import React, { useCallback } from "react";
import { ProgramCard } from "@/components/cards/ProgramCard";
import { showToast } from "@/stores/toastStore";
import { extractPlainText } from "@/api/catalog";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import { formatDuration } from "@/utils/catalogFormat";
import { router } from "expo-router";
import type { ProgramListItem } from "@/api/programsApi";

interface ProgramCardRendererProps {
  isFavorite: (documentId: string) => boolean;
  isCompared: (documentId: string) => boolean;
  toggleFavorite: (prog: ProgramListItem) => void;
  toggleCompare: (prog: ProgramListItem) => void;
}

/**
 * Returns a stable renderItem callback for UniversalList<ProgramListItem>.
 * All deps are passed in — no store reads inside the hook.
 */
export function useProgramCardRenderer({
  isFavorite,
  isCompared,
  toggleFavorite,
  toggleCompare,
}: ProgramCardRendererProps) {
  const { t } = useCustomTranslation();
  const { formatCurrency, formatNumber } = useLocalization();

  return useCallback(
    (prog: ProgramListItem) => {
      const docId = prog.documentId;

      // Location: single campus → city name; multiple → "N campuses"
      const campuses = prog.campus ?? [];
      const locationLabel =
        campuses.length === 1
          ? campuses.map((c) => c.location?.city?.name).filter(Boolean).join(", ") || "-"
          : campuses.length > 1
          ? `${formatNumber(campuses.length)} ${t("campuses")}`
          : "-";

      // Languages: single → name; multiple → "N languages"
      const languages = prog.languages ?? [];
      const langLabel =
        languages.length === 1
          ? languages.map((l) => l.language).filter(Boolean).join(", ") || "-"
          : languages.length > 1
          ? `${formatNumber(languages.length)} ${t("languages")}`
          : "-";

      // Duration (shared formatter: localized digits, dual "2 Years"/"سنتان")
      const duration = formatDuration(prog.nbOfYears, t, formatNumber) || "-";

      // Fees from institution.tuition[0]
      const tuition0 = prog.institution?.tuition?.[0];
      let fees = "-";
      if (tuition0?.minTuition != null && tuition0?.maxTuition != null) {
        if (tuition0.minTuition === 0 && tuition0.maxTuition === 0) {
          fees = "-";
        } else if (tuition0.minTuition === tuition0.maxTuition) {
          fees = formatCurrency(tuition0.minTuition);
        } else {
          fees = `${formatCurrency(tuition0.minTuition)}–${formatCurrency(tuition0.maxTuition)}`;
        }
      }

      const description = extractPlainText(prog.about);

      return (
        <ProgramCard
          key={docId}
          documentId={docId}
          logoSrc={prog.institution?.logo?.url}
          programTitle={prog.name || "-"}
          universityName={prog.institution?.name ?? "-"}
          description={description}
          location={locationLabel}
          duration={duration}
          degree={prog.degree?.title ?? "-"}
          fees={fees}
          language={langLabel}
          isFavorite={isFavorite(docId)}
          isCompared={isCompared(docId)}
          onToggleFavorite={() => toggleFavorite(prog)}
          onAddToCompare={() => toggleCompare(prog)}
          onPrimaryClick={() => {
            if (prog.slug && prog.institution?.slug) {
              router.push(
                `/(main)/institutions/${prog.institution.slug}/programs/${prog.slug}` as never
              );
            } else {
              showToast(`${prog.name} · ${t("common.comingSoon")}`);
            }
          }}
          compareLabel={isCompared(docId) ? t("inCompareList") : t("btnAddToCompare")}
          primaryLabel={t("checkProgram")}
        />
      );
    },
    [isFavorite, isCompared, toggleFavorite, toggleCompare, t, formatCurrency, formatNumber]
  );
}
