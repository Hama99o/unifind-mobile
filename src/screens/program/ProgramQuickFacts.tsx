/**
 * ProgramQuickFacts — Section 2: 6-item quick-facts bar.
 *
 * Items (hidden when empty/zero):
 *   1. Main Campus (campus[0].location.city.name)
 *   2. Degree (degree.title)
 *   3. Number of Years (nbOfYears min/max)
 *   4. Number of Credits (nbOfCredits min/max)
 *   5. Fees/Credit (institution.tuition[0] min/max via formatCurrency)
 *   6. Language (languages[0].language)
 *
 * RTL-safe. No hardcoded hex.
 */

import { View } from "react-native";
import {
  MapPin,
  GraduationCap,
  Hourglass,
  BookOpen,
  DollarSign,
  Globe,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import { useColors } from "@/hooks/useColors";
import type { ProgramListItem } from "@/api/programsApiTypes";
import { isolateBidi } from "@/utils/catalogFormat";

interface Props {
  program: ProgramListItem;
}

interface FactItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function ProgramQuickFacts({ program }: Props) {
  const { t, isRtl } = useCustomTranslation();
  const { formatCurrency } = useLocalization();
  const colors = useColors();

  // ── Duration ────────────────────────────────────────────────────────────────
  const nbYears = program.nbOfYears;
  let durationValue = "";
  if (nbYears) {
    const { min, max } = nbYears;
    if (min != null && max != null) {
      if (min === max) {
        durationValue =
          min === 1
            ? `1 ${t("year")}`
            : min === 2
            ? t("towYears")
            : `${min} ${t("nbYears")}`;
      } else {
        durationValue = `${min}–${max} ${t("nbYears")}`;
      }
    } else if (min != null) {
      durationValue = `${min} ${t("nbYears")}`;
    } else if (max != null) {
      durationValue = `${max} ${t("nbYears")}`;
    }
  }

  // ── Credits ─────────────────────────────────────────────────────────────────
  let creditsValue = "";
  const nbCredits = program.nbOfCredits;
  if (nbCredits) {
    const { min, max } = nbCredits;
    if (min != null && max != null) {
      creditsValue =
        min === max
          ? `${min} ${t("credits")}`
          : `${min}–${max} ${t("credits")}`;
    } else if (min != null) {
      creditsValue = `${min} ${t("credits")}`;
    } else if (max != null) {
      creditsValue = `${max} ${t("credits")}`;
    }
  }

  // ── Fees/Credit ─────────────────────────────────────────────────────────────
  // Guard: hide when both min and max are 0 (web parity — no fake "$0.00").
  let feesValue = "";
  const tuition = program.institution?.tuition?.[0];
  if (tuition) {
    const { minTuition, maxTuition } = tuition;
    const bothZero = minTuition === 0 && maxTuition === 0;
    if (!bothZero) {
      if (minTuition != null && maxTuition != null) {
        feesValue =
          minTuition === maxTuition
            ? formatCurrency(maxTuition)
            : `${isolateBidi(formatCurrency(minTuition))}–${isolateBidi(formatCurrency(maxTuition))}`;
      } else if (minTuition != null) {
        feesValue = formatCurrency(minTuition);
      } else if (maxTuition != null) {
        feesValue = formatCurrency(maxTuition);
      }
    }
  }

  const facts: FactItem[] = [
    {
      icon: <MapPin size={14} color={colors.primary} />,
      label: t("main_campus"),
      value: program.campus?.[0]?.location?.city?.name ?? "",
    },
    {
      icon: <GraduationCap size={14} color={colors.primary} />,
      label: t("degree"),
      value: program.degree?.title ?? "",
    },
    {
      icon: <Hourglass size={14} color={colors.primary} />,
      label: t("number_of_years"),
      value: durationValue,
    },
    {
      icon: <BookOpen size={14} color={colors.primary} />,
      label: t("nb_credits"),
      value: creditsValue,
    },
    {
      icon: <DollarSign size={14} color={colors.primary} />,
      label: t("fees_credit"),
      value: feesValue,
    },
    {
      icon: <Globe size={14} color={colors.primary} />,
      label: t("language"),
      value: program.languages?.[0]?.language ?? "",
    },
  ].filter((f) => f.value && f.value.trim() !== "");

  if (facts.length === 0) return null;

  return (
    <View
      className={`mx-4 mt-3 bg-card rounded-xl border border-border p-4 flex-row flex-wrap gap-x-6 gap-y-4 ${
        isRtl ? "flex-row-reverse" : ""
      }`}
    >
      {facts.map((fact, i) => (
        <View
          key={i}
          className={`flex-row items-center gap-2 w-[42%] ${isRtl ? "flex-row-reverse" : ""}`}
        >
          {fact.icon}
          <View className="flex-1">
            <Text
              className={`text-xs text-muted-foreground ${isRtl ? "text-right" : ""}`}
            >
              {fact.label}
            </Text>
            <Text
              className={`text-xs font-semibold text-foreground ${isRtl ? "text-right" : ""}`}
              numberOfLines={2}
            >
              {fact.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
