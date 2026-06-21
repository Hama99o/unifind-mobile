/**
 * OfferingOverviewSection — Rich text description + InfoCard grid.
 * Shows description (Strapi rich text) + offeringInfo cards.
 * RTL-safe. No hardcoded hex. Gluestack only.
 */

import { View } from "react-native";
import { GraduationCap } from "lucide-react-native";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { InfoCard } from "@/components/shared/InfoCard";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { renderStrapiRichText } from "@/utils/richText";
import type { StrapiOfferingDetail } from "@/api/offeringDetailApi";

interface OfferingOverviewSectionProps {
  offering: StrapiOfferingDetail;
}

export function OfferingOverviewSection({ offering }: OfferingOverviewSectionProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  const hasDescription = !!offering.description;
  const offeringInfo = offering.offeringInfo ?? [];
  const validInfo = offeringInfo.filter(
    (info: { type?: { type?: string }; info?: string }) => info?.type?.type && info?.info
  );

  if (!hasDescription && validInfo.length === 0) return null;

  return (
    <View className="px-4 gap-3">
      <Heading size="md" className={`text-foreground mb-1 ${isRtl ? "text-right" : ""}`}>
        {t("offeringOverview")}
      </Heading>
      <Divider className="mb-3" />

      {hasDescription && (
        <View className="mb-2">
          {renderStrapiRichText(offering.description)}
        </View>
      )}

      {validInfo.length > 0 && (
        <View className="gap-3">
          {validInfo.map(
            (
              info: { type?: { type?: string; icon?: string }; info?: string; url?: string; id?: string | number },
              index: number
            ) => (
              <InfoCard
                key={info.id ?? index}
                icon={<GraduationCap size={16} color={colors.primary} />}
                title={info?.type?.type ?? "-"}
                description={info?.info ?? "-"}
                url={info?.url}
              />
            )
          )}
        </View>
      )}
    </View>
  );
}
