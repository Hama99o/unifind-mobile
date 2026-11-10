/**
 * AcademicProgramCard — single program card inside a FacultyAccordion.
 *
 * Shows: name, degree, department, campus, duration, fees (formatCurrency),
 * language, favorite heart [auth], add-to-compare button [auth].
 * Tap → program detail route.
 *
 * Extracted from InstitutionAcademicSection to keep files under ~300 lines.
 * RTL-safe. Gluestack only.
 */

import { View, Pressable } from "react-native";
import { MapPin, Clock, DollarSign, Languages, Heart } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { useLocalization } from "@/hooks/useLocalization";
import { showToast } from "@/stores/toastStore";
import { useSignInSheet } from "@/auth/useSignInSheet";
import { router } from "expo-router";
import type { ProgramForFaculty } from "@/api/institutionDetailApi";
import { isolateBidi } from "@/utils/catalogFormat";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AcademicProgramCardProps {
  program: ProgramForFaculty;
  institutionSlug: string;
  isFavorite: boolean;
  isCompared: boolean;
  isLoggedIn: boolean;
  onToggleFavorite: (docId: string) => void;
  onToggleCompare: (docId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AcademicProgramCard({
  program,
  institutionSlug,
  isFavorite,
  isCompared,
  isLoggedIn,
  onToggleFavorite,
  onToggleCompare,
}: AcademicProgramCardProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const { formatCurrency } = useLocalization();
  const { open: openSignIn } = useSignInSheet();

  const campus = program.campus?.name ?? "-";
  const language = program.languages?.[0]?.language ?? "-";
  const years = program.nbOfYears;
  const duration =
    years
      ? years.min === years.max
        ? `${years.min} ${t("year")}`
        : `${years.min}–${years.max} ${t("nbYears")}`
      : "-";

  const tuition = program.institution?.tuition ?? [];
  const fees = (() => {
    const valid = tuition.filter((tu) => tu.minTuition != null && tu.maxTuition != null);
    if (valid.length === 0) return "-";
    const min = Math.min(...valid.map((tu) => tu.minTuition!));
    const max = Math.max(...valid.map((tu) => tu.maxTuition!));
    if (min === 0 && max === 0) return "-";
    return min === max
      ? formatCurrency(min)
      : `${isolateBidi(formatCurrency(min))}–${isolateBidi(formatCurrency(max))}`;
  })();

  const handlePress = () => {
    if (program.slug) {
      router.push(`/(main)/institutions/${institutionSlug}/programs/${program.slug}` as never);
    } else {
      showToast(`${program.name} · ${t("common.comingSoon")}`);
    }
  };

  const handleFavorite = () => {
    if (!isLoggedIn) { openSignIn(); return; }
    onToggleFavorite(program.documentId);
  };

  const handleCompare = () => {
    if (!isLoggedIn) { openSignIn(); return; }
    onToggleCompare(program.documentId);
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`bg-background rounded-xl border border-border p-3 gap-2 ${isRtl ? "items-end" : ""}`}
    >
      {/* Title row */}
      <View className={`flex-row items-start justify-between gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        <View className="flex-1">
          <Text
            className={`text-sm font-semibold text-foreground ${isRtl ? "text-right" : ""}`}
            numberOfLines={2}
          >
            {program.name}
          </Text>
          {program.degree?.title ? (
            <Text className={`text-xs text-muted-foreground mt-0.5 ${isRtl ? "text-right" : ""}`}>
              {program.degree.title}
              {program.department ? ` · ${program.department}` : ""}
            </Text>
          ) : null}
        </View>

        {/* Favorite */}
        <Pressable onPress={handleFavorite} hitSlop={14} className="p-1">
          <Heart
            size={18}
            color={isFavorite ? colors.destructive : colors.mutedForeground}
            fill={isFavorite ? colors.destructive : "transparent"}
          />
        </Pressable>
      </View>

      {/* Meta chips */}
      <View className={`flex-row flex-wrap gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        {campus !== "-" && (
          <View className={`flex-row items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
            <MapPin size={11} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">{campus}</Text>
          </View>
        )}
        {duration !== "-" && (
          <View className={`flex-row items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Clock size={11} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">{duration}</Text>
          </View>
        )}
        {fees !== "-" && (
          <View className={`flex-row items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
            <DollarSign size={11} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">{fees}</Text>
          </View>
        )}
        {language !== "-" && (
          <View className={`flex-row items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Languages size={11} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">{language}</Text>
          </View>
        )}
      </View>

      {/* Compare button */}
      <Pressable
        onPress={handleCompare}
        className={`self-start px-3 py-1 rounded-full border ${
          isCompared ? "bg-secondary border-secondary" : "border-border"
        }`}
      >
        <Text className="text-xs text-foreground">
          {isCompared ? t("inCompareList") : t("addToCompare")}
        </Text>
      </Pressable>
    </Pressable>
  );
}
