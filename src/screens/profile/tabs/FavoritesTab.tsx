/**
 * FavoritesTab — Profile > Favorites tab.
 *
 * 3 sub-tabs: Programs | Institutions | Offerings
 * Each sub-tab is a separate file in tabs/favorites/.
 *
 * §2: pills wrapped in horizontal ScrollView showsHorizontalScrollIndicator={false}
 *     gap:8, isRtl flex-row-reverse.
 */

import { useState } from "react";
import { View, ScrollView } from "react-native";
import { BookOpen, Building2, Layers } from "lucide-react-native";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { SegmentedPill } from "@/components/common/SegmentedPill";
import { ProgramsFavoriteTab } from "@/screens/profile/tabs/favorites/ProgramsFavoriteTab";
import { InstitutionsFavoriteTab } from "@/screens/profile/tabs/favorites/InstitutionsFavoriteTab";
import { OfferingsFavoriteTab } from "@/screens/profile/tabs/favorites/OfferingsFavoriteTab";

type FavTab = "programs" | "institutions" | "offerings";

export function FavoritesTab() {
  const { t, isRtl } = useCustomTranslation();
  const [activeTab, setActiveTab] = useState<FavTab>("programs");

  return (
    <View className="flex-1">
      {/* §2: horizontal ScrollView for pills, RTL-safe, gap:8 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          gap: 8,
          flexDirection: isRtl ? "row-reverse" : "row",
        }}
      >
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
        <SegmentedPill
          label={t("offering")}
          icon={Layers}
          active={activeTab === "offerings"}
          onPress={() => setActiveTab("offerings")}
        />
      </ScrollView>

      {/* Tab content — each tab scrolls internally */}
      <View className="flex-1">
        {activeTab === "programs" && <ProgramsFavoriteTab />}
        {activeTab === "institutions" && <InstitutionsFavoriteTab />}
        {activeTab === "offerings" && <OfferingsFavoriteTab />}
      </View>
    </View>
  );
}
