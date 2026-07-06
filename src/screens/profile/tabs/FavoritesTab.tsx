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
import { View } from "react-native";
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
      {/* Sub-tab bar — wrapping row (not a horizontal ScrollView, whose default
          cross-axis stretch blew the pills into full-height cards). RTL-safe. */}
      <View
        className="flex-row flex-wrap items-center gap-2 px-4 py-2"
        style={{ flexDirection: isRtl ? "row-reverse" : "row" }}
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
      </View>

      {/* Tab content — each tab scrolls internally */}
      <View className="flex-1">
        {activeTab === "programs" && <ProgramsFavoriteTab />}
        {activeTab === "institutions" && <InstitutionsFavoriteTab />}
        {activeTab === "offerings" && <OfferingsFavoriteTab />}
      </View>
    </View>
  );
}
