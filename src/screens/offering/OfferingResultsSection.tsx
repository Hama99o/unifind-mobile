/**
 * OfferingResultsSection — "Core Learnings" section.
 * Only renders if results.length > 0.
 * RTL-safe. No hardcoded hex. Gluestack only.
 */

import { View } from "react-native";
import { Star } from "lucide-react-native";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { InfoCard } from "@/components/shared/InfoCard";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import type { StrapiOfferingDetail } from "@/api/offeringDetailApi";

interface OfferingResultsSectionProps {
  offering: StrapiOfferingDetail;
}

export function OfferingResultsSection({ offering }: OfferingResultsSectionProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  const results = offering.results ?? [];
  if (results.length === 0) return null;

  return (
    <View className="px-4 gap-3">
      <Heading size="md" className={`text-foreground mb-1 ${isRtl ? "text-right" : ""}`}>
        {t("coreLearnings")}
      </Heading>
      <Divider className="mb-3" />

      <View className="gap-3">
        {results.map(
          (
            result: { title?: string; info?: string; url?: string; icon?: string; id?: string | number },
            index: number
          ) => (
            <InfoCard
              key={result.id ?? index}
              icon={<Star size={16} color={colors.primary} />}
              title={result.title ?? "-"}
              description={result.info ?? "-"}
              url={result.url}
            />
          )
        )}
      </View>
    </View>
  );
}
