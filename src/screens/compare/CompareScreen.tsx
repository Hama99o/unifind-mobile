/**
 * CompareScreen — Standalone full-screen compare view.
 * Web parity: /[locale]/compare
 *
 * Auth-gated: logged out → shows SignInSheet overlay (not a hard redirect).
 * Reuses ComparisonsTab (which in turn uses ProgramsCompareTab +
 * InstitutionsCompareTab + ComparisonTable) — no table logic is duplicated.
 *
 * Route param ?tab=programs|institutions sets the initial sub-tab.
 */

import { useAuthStore } from "@/stores/authStore";
import { useSignInSheet } from "@/auth/useSignInSheet";
import { useEffect } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/button";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { EmptyState } from "@/components/shared/EmptyState";

import { CompareTabs } from "@/screens/compare/CompareTabs";

// ─── Signed-out state ─────────────────────────────────────────────────────────

function SignedOutPlaceholder() {
  const { t } = useCustomTranslation();
  const { open } = useSignInSheet();

  return (
    <View className="flex-1">
      <EmptyState
        title={t("signInRequired")}
        description={t("compareSignInDescription")}
      />
      <View className="items-center pb-8">
        <Button
          label={t("signIn")}
          action="primary"
          variant="solid"
          onPress={open}
          className="min-w-48"
        />
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CompareScreen() {
  const { t } = useCustomTranslation();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { open } = useSignInSheet();

  // Route param for initial tab
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab: "programs" | "institutions" =
    params.tab?.toLowerCase() === "institutions" ? "institutions" : "programs";

  // If user navigates here logged-out, open the sheet once
  useEffect(() => {
    if (!isLoggedIn) {
      open();
    }
    // Only fire once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenContainer>
      <AppHeader title={t("compare")} showBack />
      {isLoggedIn ? (
        <CompareTabs initialTab={initialTab} />
      ) : (
        <SignedOutPlaceholder />
      )}
    </ScreenContainer>
  );
}
