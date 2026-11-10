/**
 * SimilarProgramsSection — Section 5 of ProgramDetailScreen.
 *
 * Horizontal carousel of ProgramCard for related programs.
 * Loads by specialisations.studyField.id[], page-appended (load-more on end).
 * Each card: favorite (Program documentId, auth), compare (Program documentId,
 *   auth, max5), tap → program detail route.
 * Auth-gated via SignInSheet (handled inside useProgramSelection).
 *
 * RTL-safe. Gluestack only.
 */

import { View, ScrollView } from "react-native";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { Button } from "@/components/ui/button";
import { ProgramCard } from "@/components/cards/ProgramCard";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import { useSelection } from "@/hooks/useSelection";
import { showToast } from "@/stores/toastStore";
import { router } from "expo-router";
import { extractPlainTextFromRich } from "@/utils/richText";
import type { ProgramListItem } from "@/api/programsApiTypes";

interface Props {
  programs: ProgramListItem[];
  isLoggedIn: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

export function SimilarProgramsSection({
  programs,
  isLoggedIn: _isLoggedIn, // kept for API compat; auth handled inside useSelection
  hasMore,
  onLoadMore,
  isLoadingMore,
}: Props) {
  const { t, isRtl } = useCustomTranslation();
  const { formatCurrency } = useLocalization();
  // H1 fix: use canonical selection hook
  const { isFavorite, isCompared, toggleFavorite, toggleCompare } = useSelection();

  if (programs.length === 0) return null;

  const buildDuration = (prog: ProgramListItem): string => {
    const ny = prog.nbOfYears;
    if (!ny) return "-";
    const { min, max } = ny;
    if (min != null && max != null) {
      if (min === max) {
        return min === 1
          ? `1 ${t("year")}`
          : min === 2
          ? t("towYears")
          : `${min} ${t("nbYears")}`;
      }
      return `${min}–${max} ${t("nbYears")}`;
    }
    if (min != null) return `${min} ${t("nbYears")}`;
    if (max != null) return `${max} ${t("nbYears")}`;
    return "-";
  };

  const buildFees = (prog: ProgramListItem): string => {
    const tuition = prog.institution?.tuition?.[0];
    if (!tuition) return "";
    const { minTuition, maxTuition } = tuition;
    if (minTuition == null && maxTuition == null) return "";
    // Guard: hide zero-tuition (web parity)
    if (minTuition === 0 && maxTuition === 0) return "";
    if (minTuition === maxTuition) return formatCurrency(maxTuition ?? 0);
    return `${formatCurrency(minTuition ?? 0)}–${formatCurrency(maxTuition ?? 0)}`;
  };

  return (
    <View className="gap-4">
      <View className={`px-4 ${isRtl ? "items-end" : ""}`}>
        <Heading size="md" className={`text-foreground mb-1 ${isRtl ? "text-right" : ""}`}>
          {t("similar_programs")}
        </Heading>
        <Divider className="mb-3" />
      </View>

      {/* Horizontal scroll of ProgramCards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 16 }}
        onMomentumScrollEnd={(e) => {
          // Load more when scrolled near end
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
          const isNearEnd =
            layoutMeasurement.width + contentOffset.x >= contentSize.width - 80;
          if (isNearEnd && hasMore && !isLoadingMore) onLoadMore();
        }}
      >
        {programs.map((prog, i) => (
          <View key={`${prog.documentId}-${i}`} style={{ width: 280, marginRight: 12 }}>
            <ProgramCard
              documentId={prog.documentId}
              logoSrc={prog.institution?.logo?.url}
              programTitle={prog.name}
              universityName={prog.institution?.name ?? "-"}
              description={extractPlainTextFromRich(prog.about)}
              location={prog.campus?.[0]?.location?.city?.name ?? "-"}
              duration={buildDuration(prog)}
              degree={prog.degree?.title ?? "-"}
              fees={buildFees(prog)}
              language={prog.languages?.[0]?.language}
              isFavorite={isFavorite("Program", prog.documentId)}
              isCompared={isCompared("Program", prog.documentId)}
              onToggleFavorite={() => toggleFavorite("Program", prog.documentId)}
              onAddToCompare={() => toggleCompare("Program", prog.documentId)}
              compareLabel={
                isCompared("Program", prog.documentId)
                  ? t("inCompareList")
                  : t("btnAddToCompare")
              }
              primaryLabel={t("checkProgram")}
              onPrimaryClick={() => {
                if (prog.slug && prog.institution?.slug) {
                  router.push(
                    `/(main)/institutions/${prog.institution.slug}/programs/${prog.slug}` as never
                  );
                } else {
                  showToast(`${prog.name} · ${t("common.comingSoon")}`);
                }
              }}
            />
          </View>
        ))}

        {/* Load more inline button */}
        {hasMore && (
          <View style={{ width: 160 }} className="items-center justify-center">
            <Button
              label={isLoadingMore ? t("common.loading") : t("loadMore")}
              action="primary"
              variant="outline"
              onPress={onLoadMore}
              disabled={isLoadingMore}
              className="w-full"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
