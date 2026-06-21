/**
 * SubNavBar — horizontal segmented tab row for Programs | Institutions | Offerings.
 * Used at the top of the Program Explorer / Find screen.
 *
 * Design: pill-style segmented control — active tab gets bg-primary pill with
 * text-primary-foreground; inactive tabs are transparent with text-muted-foreground.
 * This is more readable and mobile-native than an underline approach.
 *
 * RTL: tab items render in reverse order via contentContainerStyle flexDirection.
 */

import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
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

  return (
    <View className="bg-background px-4 pb-3 pt-1">
      <View className="flex-row bg-muted rounded-xl p-1" style={{ flexDirection: isRtl ? "row-reverse" : "row" }}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              className={`flex-1 items-center justify-center py-2 rounded-lg ${isActive ? "bg-primary" : ""}`}
              style={{ minHeight: 36 }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t(tab.labelKey)}
              testID={`subnav-tab-${tab.key}`}
            >
              <Text
                className={`text-xs font-semibold ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
                numberOfLines={1}
              >
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
