/**
 * InstitutionTuitionSection — Section 4 of InstitutionDetailScreen.
 *
 * Table: Tuition Type | Min Range | Max Range
 * Hidden if single row with all-zero values.
 * Optional per-row external link.
 *
 * RTL-safe. No hardcoded hex.
 */

import { View, Pressable, Linking } from "react-native";
import { ExternalLink } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { useLocalization } from "@/hooks/useLocalization";
import type { InstitutionDetailItem } from "@/api/institutionDetailApi";

interface InstitutionTuitionSectionProps {
  institution: InstitutionDetailItem;
}

export function InstitutionTuitionSection({ institution }: InstitutionTuitionSectionProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const { formatCurrency } = useLocalization();

  const tuitionItems = institution.tuition ?? [];

  // Hide if single row all-zero
  const showSection =
    tuitionItems.length > 1 ||
    !(
      tuitionItems.length === 1 &&
      (tuitionItems[0].minTuition ?? 0) === 0 &&
      (tuitionItems[0].maxTuition ?? 0) === 0
    );

  if (!showSection || tuitionItems.length === 0) return null;

  const handleLink = (url: string) => {
    const href = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(href).catch(() => {});
  };

  return (
    <View className="px-4 gap-4">
      <Heading size="md" className={`text-foreground mb-1 ${isRtl ? "text-right" : ""}`}>
        {t("tuitionFees")}
      </Heading>
      <Divider className="mb-3" />

      {/* Table header */}
      <View className="bg-card rounded-xl border border-border overflow-hidden">
        <View
          className={`flex-row bg-muted px-3 py-2 ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <Text className="flex-1 text-xs font-bold text-foreground">{t("tuitionType")}</Text>
          <Text className={`w-24 text-xs font-bold text-foreground ${isRtl ? "text-left" : "text-right"}`}>{t("min_range")}</Text>
          <Text className={`w-24 text-xs font-bold text-foreground ${isRtl ? "text-left" : "text-right"}`}>{t("max_range")}</Text>
        </View>

        {tuitionItems.map((item, index) => (
          <View key={item.degree?.documentId ?? index}>
            {index > 0 && <Divider />}
            <View
              className={`flex-row items-center px-3 py-3 ${isRtl ? "flex-row-reverse" : ""}`}
            >
              {/* Type + optional link */}
              <View className={`flex-1 flex-row items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
                <Text className="text-sm text-foreground flex-1" numberOfLines={2}>
                  {item.tuitionType || item.degree?.title || "-"}
                </Text>
                {item.link ? (
                  <Pressable onPress={() => handleLink(item.link!)} hitSlop={8}>
                    <ExternalLink size={13} color={colors.primary} />
                  </Pressable>
                ) : null}
              </View>

              {/* Min */}
              <Text className={`w-24 text-sm text-foreground ${isRtl ? "text-left" : "text-right"}`}>
                {formatCurrency(item.minTuition ?? 0)}
              </Text>

              {/* Max */}
              <Text className={`w-24 text-sm text-foreground ${isRtl ? "text-left" : "text-right"}`}>
                {formatCurrency(item.maxTuition ?? 0)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
