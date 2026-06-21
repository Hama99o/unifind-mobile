/**
 * SubNavBar — horizontal segmented tab row for Programs | Institutions | Offerings.
 * Used at top of the Program Explorer / Find screen.
 * Inactive tabs show comingSoon toast (detail screens not built yet).
 *
 * RTL: tab items in reverse order; tab separator margin swaps sides.
 */

import { View, Pressable, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

export type SubNavTab = "programs" | "institutions" | "offerings";

interface Props {
  activeTab: SubNavTab;
  onTabPress: (tab: SubNavTab) => void;
}

const TABS: Array<{ key: SubNavTab; labelKey: string }> = [
  { key: "programs", labelKey: "programs" },
  { key: "institutions", labelKey: "institutions" },
  { key: "offerings", labelKey: "offering" },
];

export function SubNavBar({ activeTab, onTabPress }: Props) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  return (
    <View className="border-b border-border bg-background">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          flexDirection: isRtl ? "row-reverse" : "row",
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          // Use ms (margin-start) for logical RTL-safe spacing instead of mr
          const marginStyle = isRtl ? { marginLeft: 8 } : { marginRight: 8 };
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              style={marginStyle}
              className={`px-4 py-3 border-b-2 ${
                isActive ? "border-secondary" : "border-transparent"
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                className={`text-sm font-semibold ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
