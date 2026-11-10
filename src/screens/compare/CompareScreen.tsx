/**
 * CompareScreen — Standalone full-screen compare view.
 * Web parity: /[locale]/compare
 *
 * Auth-gated: logged out → inline "Sign-In Required" placeholder whose Sign In
 * button opens the global SignInSheet. (No auto-open on mount: the sheet would
 * cover the page and, being global, follow the user to the next screen.)
 * Reuses ComparisonsTab (which in turn uses ProgramsCompareTab +
 * InstitutionsCompareTab + ComparisonTable) — no table logic is duplicated.
 *
 * Route param ?tab=programs|institutions sets the initial sub-tab.
 */

import { useAuthStore } from "@/stores/authStore";
import { useSignInSheet } from "@/auth/useSignInSheet";
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

  // Route param for initial tab
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab: "programs" | "institutions" =
    params.tab?.toLowerCase() === "institutions" ? "institutions" : "programs";

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
