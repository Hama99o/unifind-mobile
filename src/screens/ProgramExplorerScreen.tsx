import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { AppHeader } from "@/components/shared/AppHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

export default function ProgramExplorerScreen() {
  const { t } = useCustomTranslation();
  return (
    <ScreenContainer>
      <AppHeader title={t("programExplorer.title")} />
      <EmptyState title={t("common.comingSoon")} description={t("programExplorer.title")} />
    </ScreenContainer>
  );
}
