import { VStack } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { AppHeader } from "@/components/shared/AppHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/authService";

export default function ProfileScreen() {
  const { t } = useCustomTranslation();
  const { isLoggedIn, user } = useAuthStore();

  if (!isLoggedIn) {
    return (
      <ScreenContainer>
        <AppHeader title={t("profile.title")} />
        <VStack className="flex-1 justify-center gap-4 px-8">
          <EmptyState title={t("profile.title")} description={t("home.subtitle")} />
          <Button label={t("profile.signIn")} onPress={() => authService.login().catch(() => {})} />
        </VStack>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <AppHeader title={t("profile.title")} />
      <Text className="mt-4">{user?.name ?? user?.email}</Text>
    </ScreenContainer>
  );
}
