/**
 * ComparisonsTab — Profile > Comparisons tab.
 *
 * 2 sub-tabs: Programs | Institutions
 * Each sub-tab lives in tabs/comparisons/.
 */

import { useState } from "react";
import { ScrollView, View } from "react-native";
import { BookOpen, Building2 } from "lucide-react-native";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { SegmentedPill } from "@/components/common/SegmentedPill";
import { ProgramsCompareTab } from "@/screens/profile/tabs/comparisons/ProgramsCompareTab";
import { InstitutionsCompareTab } from "@/screens/profile/tabs/comparisons/InstitutionsCompareTab";

type CompTab = "programs" | "institutions";

export function ComparisonsTab() {
  const { t } = useCustomTranslation();
  const [activeTab, setActiveTab] = useState<CompTab>("programs");

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* Sub-tab bar */}
      <View className="flex-row gap-2 mb-4">
        <SegmentedPill
          label={t("programs")}
          icon={BookOpen}
          active={activeTab === "programs"}
          onPress={() => setActiveTab("programs")}
        />
        <SegmentedPill
          label={t("institutions")}
          icon={Building2}
          active={activeTab === "institutions"}
          onPress={() => setActiveTab("institutions")}
        />
      </View>

      {activeTab === "programs" && <ProgramsCompareTab />}
      {activeTab === "institutions" && <InstitutionsCompareTab />}
    </ScrollView>
  );
}
