/**
 * ProgramRequirementsSection — Section 4 of ProgramDetailScreen.
 *
 * Only shown when program.requirements.length > 0.
 * Renders an InfoCard grid (icon, title, info/desc, url).
 *
 * RTL-safe. Gluestack only.
 */

import { View } from "react-native";
import { ClipboardCheck, Info } from "lucide-react-native";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { InfoCard } from "@/components/shared/InfoCard";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import type { ProgramListItem } from "@/api/programsApiTypes";

interface Props {
  program: ProgramListItem;
}

export function ProgramRequirementsSection({ program }: Props) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  const requirements = program.requirements ?? [];
  if (requirements.length === 0) return null;

  return (
    <View className="px-4 gap-4">
      <Heading
        size="md"
        className={`text-foreground mb-1 ${isRtl ? "text-right" : ""}`}
      >
        {t("admission_req")}
      </Heading>
      <Divider className="mb-3" />

      <View className="flex-row flex-wrap gap-3">
        {requirements.map((req, idx) => (
          <View key={idx} className="w-[47%]">
            <InfoCard
              icon={
                req.icon ? (
                  <ClipboardCheck size={16} color={colors.primary} />
                ) : (
                  <Info size={16} color={colors.primary} />
                )
              }
              title={req.title ?? "-"}
              description={req.info ?? "-"}
              url={req.url}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
