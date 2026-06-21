/**
 * BookingPaymentCard — Payment info section of booking detail.
 * Mirrors UFPaymentInfoCard.
 *
 * Shows: Payment Method "Whish Money", payment status pill,
 *        price, promo discount (if promocode!='null'), total,
 *        T&C + support links, "Go To Checkout" if unpaid → comingSoon.
 *
 * §2 changes:
 *   - DollarSign icon removed from the total row.
 *   - Total amount → text-xl font-bold text-foreground.
 *   - Total box: borderLeftWidth:3, borderLeftColor:colors.secondary (turquoise).
 */

import React from "react";
import { View, Linking } from "react-native";
import { CreditCard, RefreshCw, Percent } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/StatusPill";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { showToast } from "@/stores/toastStore";
import type { PaymentStatus } from "@/api/bookingsApi";

export interface PaymentCardData {
  method: string;
  status: PaymentStatus;
  promocode: string;
  promoCodeName?: string;
  price: string;
  discountedPriceEvent: string;
  priceAfterPromoCode: string;
  bookingReference: string;
}

export function BookingPaymentCard({ data }: { data: PaymentCardData }) {
  const { t } = useCustomTranslation();
  const colors = useColors();
  const hasPromo = data.promocode && data.promocode !== "null";

  const rows = [
    {
      icon: CreditCard,
      label: t("bookingDetail.paymentMethod"),
      value: data.method,
      pill: null as React.ReactNode,
    },
    {
      icon: RefreshCw,
      label: t("bookingDetail.paymentStatus"),
      value: null as string | null,
      pill: <StatusPill status={data.status} />,
    },
  ];

  return (
    <View className="bg-card rounded-2xl border border-border p-4 gap-4">
      <Heading size="sm" className="text-foreground border-b border-border pb-3">
        {t("bookingDetail.paymentInfo")}
      </Heading>

      <View className="gap-3">
        {rows.map((row) => (
          <View key={row.label} className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <row.icon size={16} color={colors.mutedForeground} />
              <Text className="text-sm text-foreground">{row.label}</Text>
            </View>
            {row.pill ?? <Text className="text-sm text-foreground">{row.value}</Text>}
          </View>
        ))}

        {/* Price row */}
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-foreground">{t("bookingDetail.price")}</Text>
          <Text className="text-sm text-foreground">{data.discountedPriceEvent}</Text>
        </View>

        {/* Promo discount */}
        {hasPromo && (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Percent size={16} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 14 }}>
                {t("bookingDetail.promocode")}{data.promoCodeName ? ` (${data.promoCodeName})` : ""}
              </Text>
            </View>
            <Text style={{ color: colors.foreground, fontSize: 14 }}>-{data.promocode}</Text>
          </View>
        )}
      </View>

      {/* Total box — §2: borderLeft turquoise accent, no DollarSign icon, text-xl bold */}
      <View
        className="bg-muted rounded-xl p-3"
        style={{
          borderLeftWidth: 3,
          borderLeftColor: colors.secondary,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-foreground">
            {t("bookingDetail.totalPrice")}
          </Text>
          <Text className="text-xl font-bold text-foreground">
            {data.priceAfterPromoCode || data.price}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View className="gap-1 border-t border-border pt-3">
        <Text className="text-xs text-muted-foreground">
          {t("bookingDetail.checkTerms")}{" "}
          <Text
            style={{ color: colors.primary, textDecorationLine: "underline", fontSize: 12 }}
            onPress={() => showToast(t("common.comingSoon"))}
          >
            {t("bookingDetail.termsAndConditions")}
          </Text>
        </Text>
        <Text className="text-xs text-muted-foreground">
          {t("bookingDetail.support")}{" "}
          <Text
            style={{ color: colors.primary, textDecorationLine: "underline", fontSize: 12 }}
            onPress={() => Linking.openURL("mailto:info@unifind.online")}
          >
            info@unifind.online
          </Text>
        </Text>
      </View>

      {/* Checkout CTA */}
      {data.status === "unpaid" && (
        <Button
          label={t("bookingDetail.goToCheckout")}
          action="primary"
          onPress={() => showToast(t("common.comingSoon"))}
        />
      )}
    </View>
  );
}
