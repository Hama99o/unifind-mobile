/**
 * SignInSheet — mobile equivalent of web's SignInModal (Radix Dialog).
 *
 * An Actionsheet (bottom-sheet) that presents the upsell:
 *   - Title: "Sign In Required"
 *   - Description of the benefit
 *   - "Why Join UniFind?" heading + 3 benefit rows
 *   - Primary: Sign In button (Auth0 hosted login)
 *   - Outlined: Create Account button (Auth0 signup with screen_hint=signup)
 *   - Close (X) button
 *
 * RTL-safe: row directions flip in Arabic.
 * Consumed via: useSignInSheet() hook or SignInSheetProvider.
 */

import { View, Pressable } from "react-native";
import { X, ClipboardList, Heart, ArrowLeftRight } from "lucide-react-native";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
} from "@/components/ui/actionsheet";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { HStack, VStack } from "@/components/ui/box";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { IconCircle } from "@/components/shared/IconCircle";
import { useAuthActions } from "@/auth/useAuthActions";
import { useSignInSheet } from "@/auth/useSignInSheet";
import { useAuthStore } from "@/stores/authStore";
import { Logo } from "@/components/shared/Logo";

// ─── Benefit row ──────────────────────────────────────────────────────────────

interface BenefitRowProps {
  icon: React.ReactNode;
  label: string;
  isRtl: boolean;
}

function BenefitRow({ icon, label, isRtl }: BenefitRowProps) {
  return (
    <HStack
      className={`gap-3 py-2.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}
    >
      <IconCircle size={36}>
        {icon}
      </IconCircle>
      <Text className="flex-1 text-sm text-foreground">{label}</Text>
    </HStack>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SignInSheet() {
  const { t, isRtl } = useCustomTranslation();
  const { isOpen, close } = useSignInSheet();
  const colors = useColors();
  const { busy, signIn: handleSignIn, createAccount: handleCreateAccount } = useAuthActions(
    () => {
      if (useAuthStore.getState().isLoggedIn) close();
    }
  );

  return (
    <Actionsheet isOpen={isOpen} onClose={close}>
      <ActionsheetBackdrop onPress={close} />
      <ActionsheetContent className="pb-8">
        <ActionsheetDragIndicator />

        {/* Header row */}
        <HStack
          className={`px-5 pt-3 pb-1 justify-between ${isRtl ? "flex-row-reverse" : ""}`}
        >
          {/* Brand strip — real logo on light sheet */}
          <View className={`flex-row items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Logo variant="prussian" height={22} />
          </View>

          {/* Close */}
          <Pressable
            onPress={close}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          >
            <X size={22} color={colors.foreground} />
          </Pressable>
        </HStack>

        <VStack className="px-5 gap-4 mt-2">
          {/* Sheet title */}
          <Heading size="md" className="text-foreground">
            {t("signInRequired")}
          </Heading>

          {/* Description */}
          <Text className="text-sm text-muted-foreground">
            {t("signInDescription")}
          </Text>

          {/* Why Join heading */}
          <Heading size="sm" className="text-foreground">
            {t("whyJoin")}
          </Heading>

          {/* Benefit rows */}
          <VStack className="gap-0">
            <BenefitRow
              icon={<ClipboardList size={18} color={colors.primary} />}
              label={t("bookManage")}
              isRtl={isRtl}
            />
            <Divider className="mx-1" />
            <BenefitRow
              icon={<Heart size={18} color={colors.primary} />}
              label={t("personalizedExperience")}
              isRtl={isRtl}
            />
            <Divider className="mx-1" />
            <BenefitRow
              icon={<ArrowLeftRight size={18} color={colors.primary} />}
              label={t("compareInstitutions")}
              isRtl={isRtl}
            />
          </VStack>

          {/* Actions */}
          <VStack className="gap-3 mt-2">
            <Button
              label={t("signIn")}
              action="primary"
              variant="solid"
              onPress={handleSignIn}
              disabled={busy !== null}
              testID="signin-sheet-signin"
            />
            <Button
              label={t("createAccount")}
              action="primary"
              variant="outline"
              onPress={handleCreateAccount}
              disabled={busy !== null}
              testID="signin-sheet-create-account"
            />
          </VStack>
        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
}
