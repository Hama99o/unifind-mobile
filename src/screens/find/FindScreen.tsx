/**
 * FindScreen — Program Explorer tab root container.
 * Renders SubNavBar [Programs | Institutions | Offerings] and switches
 * content IN-PLACE between FindProgramsScreen, FindInstitutionsScreen,
 * and FindOfferingsScreen.
 *
 * - Default sub-tab = Programs
 * - Home FindBar deep-link: ?find=programs / ?find=institutions / ?find=offerings
 * - Each child screen's own deep-link params pass through transparently
 *   via useLocalSearchParams in the child.
 */

import React, { useCallback, useState } from "react";
import { LayoutAnimation, Platform, UIManager } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { SubNavBar, type SubNavTab } from "@/components/common/SubNavBar";

import FindProgramsScreen from "@/screens/find/FindProgramsScreen";
import FindInstitutionsScreen from "@/screens/find/FindInstitutionsScreen";
import FindOfferingsScreen from "@/screens/find/FindOfferingsScreen";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FindScreen() {
  const params = useLocalSearchParams<{ find?: string }>();

  // Resolve initial tab from route param
  const resolveInitialTab = (): SubNavTab => {
    const hint = params.find?.toLowerCase();
    if (hint === "institutions") return "institutions";
    if (hint === "offerings") return "offerings";
    return "programs"; // default
  };

  const [activeTab, setActiveTab] = useState<SubNavTab>(resolveInitialTab);

  const handleTabPress = useCallback((tab: SubNavTab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  }, []);

  // Build the shared SubNavBar node
  const subNav = (
    <SubNavBar activeTab={activeTab} onTabPress={handleTabPress} />
  );

  if (activeTab === "institutions") {
    return <FindInstitutionsScreen subNav={subNav} />;
  }

  if (activeTab === "offerings") {
    return <FindOfferingsScreen subNav={subNav} />;
  }

  // Default: programs
  return <FindProgramsScreen subNav={subNav} />;
}
