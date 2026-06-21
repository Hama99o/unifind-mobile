/**
 * OfferingRequirementsSection — "Recommended to Have" section.
 * Only renders if requirements.length > 0.
 * RTL-safe. No hardcoded hex. Gluestack only.
 */

import { View } from "react-native";
import { CheckCircle } from "lucide-react-native";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { InfoCard } from "@/components/shared/InfoCard";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import type { StrapiOfferingDetail } from "@/api/offeringDetailApi";

interface OfferingRequirementsSectionProps {
  offering: StrapiOfferingDetail;
}

export function OfferingRequirementsSection({ offering }: OfferingRequirementsSectionProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  const requirements = offering.requirements ?? [];
  if (requirements.length === 0) return null;

  return (
    <View className="px-4 gap-3">
      <Heading size="md" className={`text-foreground mb-1 ${isRtl ? "text-right" : ""}`}>
        {t("recommendedToHave")}
      </Heading>
      <Divider className="mb-3" />

      <View className="gap-3">
        {requirements.map(
          (
            req: { title?: string; info?: string; url?: string; icon?: string; id?: string | number },
            index: number
          ) => (
            <InfoCard
              key={req.id ?? index}
              icon={<CheckCircle size={16} color={colors.primary} />}
              title={req.title ?? "-"}
              description={req.info ?? "-"}
              url={req.url}
            />
          )
        )}
      </View>
    </View>
  );
}
