/**
 * AboutMeTab — 3 sub-tabs: Overview, Academic Background, Professional Background.
 *
 * Uses the shared SegmentedPill (no icon) for the sub-tab bar.
 * Pills in a horizontal ScrollView, RTL-safe.
 */

import { useState } from "react";
import { View } from "react-native";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { SegmentedPill } from "@/components/common/SegmentedPill";
import { OverviewSection } from "./about/OverviewSection";
import { AcademicBackgroundSection } from "./about/AcademicBackgroundSection";
import { ProfessionalBackgroundSection } from "./about/ProfessionalBackgroundSection";

type SubTab = "overview" | "academic" | "professional";

const SUB_TABS: Array<{ id: SubTab; labelKey: string }> = [
  { id: "overview",      labelKey: "overview" },
  { id: "academic",      labelKey: "academicBackground" },
  { id: "professional",  labelKey: "professionalBackground" },
];

export function AboutMeTab() {
  const { t, isRtl } = useCustomTranslation();
  const [active, setActive] = useState<SubTab>("overview");

  return (
    <View className="flex-1">
      {/* Sub-tab bar — shared SegmentedPill (no icon), wrapping row, RTL.
          A plain items-center row (not a horizontal ScrollView) keeps the pills
          at their natural height; the ScrollView's default cross-axis stretch
          was blowing the pills up into full-height cards on the New Arch. */}
      <View
        className="flex-row flex-wrap items-center gap-2 px-4 py-2"
        style={{ flexDirection: isRtl ? "row-reverse" : "row" }}
      >
        {SUB_TABS.map((tab) => (
          <SegmentedPill
            key={tab.id}
            label={t(tab.labelKey)}
            active={tab.id === active}
            onPress={() => setActive(tab.id)}
          />
        ))}
      </View>

      {/* Content */}
      <View className="flex-1">
        {active === "overview" && <OverviewSection />}
        {active === "academic" && <AcademicBackgroundSection />}
        {active === "professional" && <ProfessionalBackgroundSection />}
      </View>
    </View>
  );
}
