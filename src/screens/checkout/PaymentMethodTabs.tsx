/**
 * PaymentMethodTabs — Whish Money | Card (Soon) tab selector.
 * Whish is the only active method; Card is disabled (web parity).
 *
 * §2 changes:
 *   - Disabled "Card" tab wrapped in Pressable → showToast(t('common.comingSoon')).
 *   - Outline Badge with t('common.soon') label beside the card tab text.
 *   - Outer opacity:0.5 removed; text remains text-muted-foreground + border-dashed.
 *   - brand import removed; GradientView uses colors.primary / colors.secondary tokens.
 */

import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge, BadgeText } from "@/components/ui/badge";
import { GradientView } from "@/components/shared/GradientView";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { showToast } from "@/stores/toastStore";

interface PaymentMethodTabsProps {
  selected: string;
}

export function PaymentMethodTabs({ selected }: PaymentMethodTabsProps) {
  const { t } = useCustomTranslation();
  const colors = useColors();

  const tabs = [
    { value: "whish", label: t("whish_money"), disabled: false },
    { value: "card", label: t("cardSoon"), disabled: true },
  ];

  return (
    <View className="flex-row gap-2 bg-muted rounded-xl p-1">
      {tabs.map((tab) => {
        const isActive = selected === tab.value && !tab.disabled;

        if (tab.disabled) {
          // §2: wrap in Pressable → showToast on tap; no opacity:0.5; border-dashed
          return (
            <Pressable
              key={tab.value}
              style={{ flex: 1 }}
              onPress={() => showToast(t("common.comingSoon"))}
              accessibilityRole="button"
              accessibilityLabel={`${tab.label} — ${t("common.comingSoon")}`}
            >
              <View
                className="items-center py-2 px-3 rounded-xl flex-row justify-center gap-1"
                style={{
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: colors.border,
                }}
              >
                <Text
                  className="text-muted-foreground text-sm font-medium"
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
                {/* §2: outline Badge with 'soon' label */}
                <Badge
                  className="bg-transparent border border-border px-1 py-0"
                >
                  <BadgeText className="text-muted-foreground">
                    {t("common.soon")}
                  </BadgeText>
                </Badge>
              </View>
            </Pressable>
          );
        }

        return (
          <View key={tab.value} style={{ flex: 1 }}>
            {isActive ? (
              <GradientView
                colors={[colors.primary, colors.secondary]}
                style={{ borderRadius: 10 }}
                className="items-center py-2 px-3"
              >
                <Text
                  style={{
                    color: colors.onOverlay,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </GradientView>
            ) : (
              <View className="items-center py-2 px-3 rounded-xl">
                <Text
                  className="text-muted-foreground text-sm font-medium"
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
