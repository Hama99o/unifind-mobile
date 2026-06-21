/**
 * InstitutionOverviewSection — Section 2 of InstitutionDetailScreen.
 *
 * Rich-text `about` + InfoCard grid (institutionInfo) + RankingCard grid (ranking).
 * RTL-safe. Gluestack only.
 */

import React from "react";
import { View } from "react-native";
import { GraduationCap, Globe, Building2 } from "lucide-react-native";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { InfoCard } from "@/components/shared/InfoCard";
import { RankingCard } from "@/components/shared/RankingCard";
import { renderStrapiRichText } from "@/utils/richText";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import type { InstitutionDetailItem } from "@/api/institutionDetailApi";

// ─── Icon mapper (map Strapi icon names to lucide equivalents) ─────────────────

function getInfoIcon(iconName?: string, colors?: { primary: string }) {
  const c = colors?.primary ?? "";
  switch ((iconName ?? "").toLowerCase()) {
    case "graduation-cap":
    case "graduationcap":
      return <GraduationCap size={18} color={c} />;
    case "globe":
    case "earth":
      return <Globe size={18} color={c} />;
    default:
      return <Building2 size={18} color={c} />;
  }
}

interface InstitutionOverviewSectionProps {
  institution: InstitutionDetailItem;
}

export function InstitutionOverviewSection({ institution }: InstitutionOverviewSectionProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  const infos = (institution.institutionInfo ?? []).filter(
    (info) => info?.type?.type
  );
  const rankings = (institution.ranking ?? []).filter(
    (r) => r.position && r.position > 0
  );

  return (
    <View className="px-4 gap-4">
      <Heading size="md" className={`text-foreground mb-1 ${isRtl ? "text-right" : ""}`}>
        {t("overview")}
      </Heading>
      <Divider className="mb-3" />

      {/* Rich-text about */}
      {institution.about ? (
        <View className={isRtl ? "items-end" : ""}>
          {renderStrapiRichText(institution.about) as React.ReactNode}
        </View>
      ) : null}

      {/* InfoCard grid */}
      {infos.length > 0 && (
        <View className="gap-3">
          {infos.map((info, i) => (
            <InfoCard
              key={info.id ?? i}
              icon={getInfoIcon(info.type?.icon, colors)}
              title={info.type?.type ?? "-"}
              description={info.info ?? "-"}
              url={info.url}
            />
          ))}
        </View>
      )}

      {/* RankingCard grid */}
      {rankings.length > 0 && (
        <View className="gap-3">
          {rankings.map((ranking, i) => (
            <RankingCard
              key={ranking.id ?? i}
              title={ranking.organizations?.[0]?.rankingCategory ?? t("ranking")}
              position={ranking.position ?? 0}
              url={ranking.url}
            />
          ))}
        </View>
      )}
    </View>
  );
}
