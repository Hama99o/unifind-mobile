/**
 * FindScreen — Program Explorer tab root container.
 * Renders a cohesive header area: back button + title + segmented sub-tabs,
 * then switches content IN-PLACE between FindProgramsScreen,
 * FindInstitutionsScreen, and FindOfferingsScreen.
 *
 * Design: the SubNavBar pill control sits directly below the title line
 * within the same bg-background header block — one cohesive unit instead
 * of two visually separate bars.
 *
 * - Default sub-tab = Programs
 * - Home FindBar deep-link: ?find=programs / ?find=institutions / ?find=offerings
 * - Each child screen's own deep-link params pass through transparently
 *   via useLocalSearchParams in the child.
 */

import React, { useCallback, useState } from "react";
import { Platform, UIManager, View, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

import { Heading } from "@/components/ui/heading";
import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { SubNavBar, type SubNavTab } from "@/components/common/SubNavBar";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";

import FindProgramsScreen from "@/screens/find/FindProgramsScreen";
import FindInstitutionsScreen from "@/screens/find/FindInstitutionsScreen";
import FindOfferingsScreen from "@/screens/find/FindOfferingsScreen";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** When `asTabRoot` is true the screen is the Program Explorer bottom-tab root:
 *  it shows all programs directly (no pre-applied filter) and renders NO back
 *  button (a tab root has nowhere to go back to). When false it's a pushed
 *  route (e.g. a deep-link from the home FindBar) and shows the back button. */
export default function FindScreen({ asTabRoot = false }: { asTabRoot?: boolean } = {}) {
  const params = useLocalSearchParams<{ find?: string }>();
  const router = useRouter();
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  // Resolve initial tab from route param
  const resolveInitialTab = (): SubNavTab => {
    const hint = params.find?.toLowerCase();
    if (hint === "institutions") return "institutions";
    if (hint === "offerings") return "offerings";
    return "programs";
  };

  const [activeTab, setActiveTab] = useState<SubNavTab>(resolveInitialTab);

  const handleTabPress = useCallback((tab: SubNavTab) => {
    setActiveTab(tab);
  }, []);

  // FIXED cohesive header (title + sub-tab pill). Rendered ONCE and kept stable
  // so switching sub-tabs only swaps the embedded list BELOW it — no full
  // re-mount of the header, no "everything jumps/resizes" on tab change.
  return (
    <ScreenContainer>
      <View className="bg-background border-b border-border">
        {/* Title row */}
        <View
          className={`flex-row items-center gap-2 px-4 pt-4 pb-2 ${isRtl ? "flex-row-reverse" : ""}`}
        >
          {!asTabRoot && (
            <Pressable
              onPress={() => router.back()}
              className="p-1"
              hitSlop={14}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <BackIcon size={24} color={colors.foreground} />
            </Pressable>
          )}
          <Heading size="lg" numberOfLines={1} className="flex-1 text-foreground">
            {t("programExplorer.title")}
          </Heading>
        </View>
        {/* Segmented pill tabs */}
        <SubNavBar activeTab={activeTab} onTabPress={handleTabPress} />
      </View>

      {/* Only the list swaps — header above stays put */}
      {activeTab === "institutions" ? (
        <FindInstitutionsScreen embedded />
      ) : activeTab === "offerings" ? (
        <FindOfferingsScreen embedded />
      ) : (
        <FindProgramsScreen embedded />
      )}
    </ScreenContainer>
  );
}
