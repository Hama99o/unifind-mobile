/**
 * PaymentsUnavailableNotice — shown instead of the Book / Pay buttons while the
 * payments switch (src/config/payments.ts) is OFF. Informational only: no button,
 * so there is nothing dead to tap.
 */

import { View } from "react-native";
import { Clock } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

export function PaymentsUnavailableNotice() {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  return (
    <View
      testID="payments-unavailable"
      accessibilityRole="text"
      className={`flex-row gap-3 rounded-xl border border-border bg-muted p-4 ${isRtl ? "flex-row-reverse" : ""}`}
    >
      <Clock color={colors.primary} size={20} />
      <View className="flex-1 gap-1">
        <Text className={`text-sm font-semibold text-foreground ${isRtl ? "text-right" : ""}`}>
          {t("paymentsComingSoonTitle")}
        </Text>
        <Text className={`text-sm text-muted-foreground ${isRtl ? "text-right" : ""}`}>
          {t("paymentsComingSoonBody")}
        </Text>
      </View>
    </View>
  );
}
