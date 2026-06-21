/**
 * PaymentWebViewModal — full-screen Modal wrapping the Whish payment WebView.
 * Extracted from OfferingCheckoutScreen to keep that file under ~300 lines.
 *
 * Handles its own header (custom back button to avoid router.back() inside
 * a Modal navigating away from the screen) and renders PaymentWebViewScreen.
 */

import { Modal, SafeAreaView, View, Pressable } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Heading } from "@/components/ui/heading";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { PaymentWebViewScreen } from "@/screens/checkout/PaymentWebViewScreen";

interface PaymentWebViewModalProps {
  collectUrl: string | null;
  bookingReference: string;
  onClose: () => void;
}

export function PaymentWebViewModal({
  collectUrl,
  bookingReference,
  onClose,
}: PaymentWebViewModalProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  return (
    <Modal
      visible={!!collectUrl}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header — custom back button; router.back() inside a Modal navigates routes */}
        <View className="flex-row items-center gap-2 px-4 py-3 border-b border-border bg-background">
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            {isRtl ? (
              <ChevronRight size={26} color={colors.foreground} />
            ) : (
              <ChevronLeft size={26} color={colors.foreground} />
            )}
          </Pressable>
          <Heading size="lg" numberOfLines={1} className="flex-1">
            {t("whish_money")}
          </Heading>
        </View>

        {collectUrl ? (
          <PaymentWebViewScreen
            collectUrl={collectUrl}
            bookingReference={bookingReference}
            onClose={onClose}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
