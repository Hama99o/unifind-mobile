/**
 * PromoBlock — promo code input + active promo banner.
 *
 * Logic:
 *   - If no promo active (neither localPromo nor booking.appliedPromoCode):
 *       show input + Apply button. On error show inline message.
 *   - If promo active: show teal banner with code chip, discount amount, Remove button.
 *     Remove calls promoCodeApi.remove with confirmAlert.
 */

import { useState } from "react";
import { View, Pressable } from "react-native";
import { Trash2, Tag } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { FormControl, FormControlError, FormControlErrorText } from "@/components/ui/form-control";
import { confirmAlert } from "@/components/ui/alert-dialog";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";
import { useColors } from "@/hooks/useColors";
import { promoCodeApi, type AppliedPromo } from "@/api/promoCodeApi";
import { showToast } from "@/stores/toastStore";
import type { CheckoutBooking } from "@/api/bookingsApi";

interface PromoBlockProps {
  booking: CheckoutBooking;
  /** The bookingReference from the route param — used for promoCodeApi.remove.
   *  The flat getById response may not include bookingReference, so we receive
   *  it separately from the route params in OfferingCheckoutScreen. */
  bookingRef: string;
  localPromo: AppliedPromo | null;
  onPromoApplied: (promo: AppliedPromo) => void;
  onPromoRemoved: (newFinalPrice: number) => void;
}

export function PromoBlock({
  booking,
  bookingRef,
  localPromo,
  onPromoApplied,
  onPromoRemoved,
}: PromoBlockProps) {
  const { t } = useCustomTranslation();
  const { formatCurrency } = useLocalization();
  const colors = useColors();

  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  // An active promo can come from either the local session apply or from booking data
  const activePromoCode = localPromo?.promoCode ?? booking.appliedPromoCode?.code ?? null;
  // Resolve currency code for formatCurrency (ISO 4217). Fall back to USD.
  const activeCurrencyCode: "USD" | "LBP" =
    (localPromo?.currency as { code?: string } | undefined)?.code === "LBP" ||
    (booking.appliedPromoCode?.currency as { code?: string } | undefined)?.code === "LBP"
      ? "LBP"
      : "USD";
  const activeDiscountAmount =
    localPromo != null
      ? localPromo.discountAmount
      : booking.pricing?.discountAmount ?? 0;
  const hasActivePromo = !!activePromoCode;

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setError("");
    setApplying(true);
    try {
      const result = await promoCodeApi.apply(
        trimmed,
        booking.offeringId._id,
        booking._id
      );
      if (result.success) {
        onPromoApplied(result);
        showToast(result.message || t("promoAppliedSuccess"));
        setCode("");
      } else {
        setError(result.message || t("promoInvalid"));
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? t("promoInvalid");
      setError(msg);
    } finally {
      setApplying(false);
    }
  };

  const handleRemove = () => {
    confirmAlert(t("removePromoTitle"), t("removePromoMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("remove"),
        style: "destructive",
        onPress: async () => {
          setRemoving(true);
          try {
            const result = await promoCodeApi.remove(bookingRef);
            if (result.success) {
              onPromoRemoved(result.data.finalPrice);
              showToast(result.message || t("promoRemovedSuccess"));
            }
          } catch {
            showToast(t("promoRemoveError"));
          } finally {
            setRemoving(false);
          }
        },
      },
    ]);
  };

  // Active promo banner (from local session OR persisted on booking)
  if (hasActivePromo) {
    return (
      <View
        className="bg-lightgreen rounded-xl border border-border px-4 py-3"
      >
        <View className="flex-row items-center justify-between">
          <View className="gap-1">
            <Text className="text-sm font-semibold text-foreground">
              {t("promo")}
            </Text>
            <View
              style={{ backgroundColor: colors.primary }}
              className="rounded-md px-2 py-0.5 self-start"
            >
              <Text
                style={{ color: colors.secondary, fontFamily: "monospace" }}
                className="text-xs font-bold uppercase tracking-wider"
              >
                {activePromoCode}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <Text className="text-base font-bold text-foreground">
              -{formatCurrency(activeDiscountAmount, activeCurrencyCode)}
            </Text>
            <Pressable
              onPress={handleRemove}
              disabled={removing}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("removePromo")}
              className="p-2 rounded-full"
            >
              <Trash2 size={18} color={colors.destructive} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Input form
  return (
    <View className="bg-card rounded-xl border border-border p-4 gap-3">
      <Text className="text-sm font-semibold text-foreground">
        {t("promo_code")}
      </Text>
      <FormControl isInvalid={!!error}>
        <View className="flex-row gap-2 items-start">
          <View className="flex-1">
            <Input>
              <InputField
                value={code}
                onChangeText={(v) => {
                  setCode(v);
                  if (error) setError("");
                }}
                placeholder={t("apply_here")}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleApply}
              />
            </Input>
            {!!error && (
              <FormControlError>
                <FormControlErrorText>{error}</FormControlErrorText>
              </FormControlError>
            )}
          </View>
          <Button
            label={t("apply_code")}
            variant="outline"
            action="primary"
            onPress={handleApply}
            disabled={applying || !code.trim()}
          />
        </View>
      </FormControl>
    </View>
  );
}
