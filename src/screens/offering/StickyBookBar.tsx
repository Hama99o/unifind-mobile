/**
 * StickyBookBar — always-visible bottom bar on Offering detail: starting price +
 * "Book a Seat" (scrolls to the specialist picker). DESIGN-01: the hero CTA used to
 * scroll out of view. Pattern ref (Mobbin): LinkedIn Learning course page,
 * https://mobbin.com/screens/0b09e33b-6aa2-435d-ba5c-2627e95d7139
 */

import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";

interface StickyBookBarProps {
  /** Lowest price across the offering's session types; hidden when unknown/0. */
  fromPrice?: number | null;
  onBook: () => void;
}

export function StickyBookBar({ fromPrice, onBook }: StickyBookBarProps) {
  const { t, isRtl } = useCustomTranslation();
  const { formatCurrency } = useLocalization();
  const insets = useSafeAreaInsets();
  const showPrice = fromPrice != null && fromPrice > 0;

  return (
    <View
      testID="sticky-book-bar"
      className={`absolute left-0 right-0 bottom-0 border-t border-border bg-background px-4 pt-3 flex-row items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {showPrice && (
        <View className="flex-1">
          <Text className={`text-xs text-muted-foreground ${isRtl ? "text-right" : ""}`}>{t("from")}</Text>
          <Text className={`text-lg font-bold text-foreground ${isRtl ? "text-right" : ""}`}>
            {formatCurrency(fromPrice, "USD")}
          </Text>
        </View>
      )}
      <View className={showPrice ? undefined : "flex-1"}>
        <Button
          label={t("bookSeat")}
          onPress={onBook}
          action="primary"
          className={showPrice ? "px-8" : "w-full"}
          testID="sticky-book-seat"
        />
      </View>
    </View>
  );
}
