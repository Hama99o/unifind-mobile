import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { AppHeader } from "@/components/shared/AppHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

export default function GrowthCenterScreen() {
  const { t } = useCustomTranslation();
  return (
    <ScreenContainer>
      <AppHeader title={t("growthCenter.title")} />
      <EmptyState title={t("common.comingSoon")} description={t("growthCenter.title")} />
    </ScreenContainer>
  );
}
