/**
 * OfferingPriceDisplay — base price (strikethrough) + final price display.
 *
 * Uses useLocalization().formatCurrency for USD/LBP.
 * RTL-safe. No hardcoded hex. Gluestack only.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { useLocalization } from "@/hooks/useLocalization";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import type { AvailabilityPrice } from "@/api/availabilityApi";

interface OfferingPriceDisplayProps {
  price: AvailabilityPrice;
}

export function OfferingPriceDisplay({ price }: OfferingPriceDisplayProps) {
  const { formatCurrency } = useLocalization();
  const { isRtl } = useCustomTranslation();
  const currency = (price.currency ?? "USD") as "USD" | "LBP";
  const hasDiscount = !!price.discountedPrice && price.discountedPrice !== price.basePrice;

  return (
    <View className={`flex-row items-center gap-3 mb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
      {hasDiscount && (
        <Text className="text-lg text-muted-foreground line-through">
          {formatCurrency(price.basePrice, currency)}
        </Text>
      )}
      <Heading size="xl" className="text-foreground">
        {formatCurrency(price.finalPrice, currency)}
      </Heading>
    </View>
  );
}
