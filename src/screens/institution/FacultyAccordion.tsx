/**
 * FacultyAccordion — collapsible accordion for a single faculty within
 * InstitutionAcademicSection.
 *
 * On first expand: lazy-loads programs via getProgramsForFaculty().
 * Handles Program favorites + compare (optimistic, with server sync).
 *
 * Extracted from InstitutionAcademicSection to keep files under ~300 lines.
 * RTL-safe. Gluestack only.
 */

import { useState } from "react";
import { View, Pressable } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { showToast } from "@/stores/toastStore";
import { useSelection } from "@/hooks/useSelection";
import { institutionDetailApi, DEGREE_TITLE_MAP } from "@/api/institutionDetailApi";
import type { AcademicFaculty, ProgramForFaculty } from "@/api/institutionDetailApi";
import { AcademicProgramCard } from "@/screens/institution/AcademicProgramCard";
import { useQuery } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

type DegreeTab = "Bachelors" | "Masters" | "PhD" | "Others";

export interface FacultyAccordionProps {
  faculty: AcademicFaculty;
  activeTab: DegreeTab;
  institutionSlug: string;
  locale: "en" | "ar";
  isLoggedIn: boolean;
  isFirst: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FacultyAccordion({
  faculty,
  activeTab,
  institutionSlug,
  locale,
  isLoggedIn,
  isFirst,
}: FacultyAccordionProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const [open, setOpen] = useState(isFirst);
  // H1 fix: use canonical selection hook (handles auth gate, optimistic, rollback, toast)
  const { isFavorite, isCompared, toggleFavorite, toggleCompare } = useSelection();

  // React Query: fetched the first time the accordion opens, then cached per
  // institution + faculty + degree tab + locale (reopening is instant).
  const isOthers = activeTab === "Others";
  const programsQuery = useQuery({
    queryKey: ["facultyPrograms", institutionSlug, faculty.facultyName, activeTab, locale],
    queryFn: () =>
      institutionDetailApi.getProgramsForFaculty(
        institutionSlug,
        faculty.facultyName,
        isOthers ? [] : DEGREE_TITLE_MAP[activeTab] ?? [],
        locale,
        isOthers
      ),
    enabled: open,
  });
  const programs: ProgramForFaculty[] = programsQuery.data ?? [];
  const loading = open && programsQuery.isPending;

  // H1 fix: delegate to canonical selection hook
  const handleToggleFavorite = (docId: string) => {
    toggleFavorite("Program", docId);
  };

  const handleToggleCompare = (docId: string) => {
    toggleCompare("Program", docId);
  };

  const ToggleIcon = open ? ChevronUp : ChevronDown;

  return (
    <View className="border border-border rounded-xl overflow-hidden mb-2">
      {/* Header */}
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className={`flex-row items-center justify-between p-3 bg-card ${isRtl ? "flex-row-reverse" : ""}`}
      >
        <View className="flex-1 gap-1">
          <Text className={`text-sm font-semibold text-foreground ${isRtl ? "text-right" : ""}`} numberOfLines={2}>
            {faculty.facultyName}
          </Text>
          {/* Campus badges */}
          {faculty.campuses.length > 0 && (
            <View className={`flex-row flex-wrap gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
              {faculty.campuses.map((campus, i) => (
                <View key={i} className="bg-lightgreen rounded-full px-2 py-0.5">
                  <Text className="text-xs text-primary font-medium">{campus}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <ToggleIcon size={18} color={colors.mutedForeground} />
      </Pressable>

      {/* Body */}
      {open && (
        <Animated.View
          entering={FadeInDown.duration(160)}
          exiting={FadeOutUp.duration(120)}
        >
          {/* className must NOT sit on Animated.View (dropped on native) — use
              an inner plain View; Animated carries only the entering/exiting. */}
          <View className="px-3 pb-3 pt-1 bg-background gap-2">
            {/* Description */}
            {faculty.description ? (
              <Text className={`text-xs text-muted-foreground ${isRtl ? "text-right" : ""}`}>
                {String(faculty.description)}
              </Text>
            ) : null}

            {/* Programs */}
            {loading && <Spinner size="small" />}
            {!loading && programs.length === 0 && programsQuery.isSuccess && (
              <Text className="text-xs text-muted-foreground">{t("common.empty")}</Text>
            )}
            {programs.map((prog) => (
              <AcademicProgramCard
                key={prog.documentId}
                program={prog}
                institutionSlug={institutionSlug}
                isFavorite={isFavorite("Program", prog.documentId)}
                isCompared={isCompared("Program", prog.documentId)}
                isLoggedIn={isLoggedIn}
                onToggleFavorite={handleToggleFavorite}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}
