import { Tabs } from "expo-router";
import { Compass, GraduationCap, Home, User } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

/** Bottom tab bar: Home · Program Explorer · Growth Center · Profile.
 * Inside each tab, screens use their own in-screen tabs/segments. */
export default function TabsLayout() {
  const colors = useColors();
  const { t } = useCustomTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        // mutedForeground (mid-gray) — NOT `muted`, which is the near-white
        // background token and made inactive tabs invisible on the light bar.
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          tabBarTestID: "tab-home",
          tabBarAccessibilityLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="program-explorer"
        options={{
          title: t("tabs.programExplorer"),
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
          tabBarTestID: "tab-program-explorer",
          tabBarAccessibilityLabel: "Program Explorer",
        }}
      />
      <Tabs.Screen
        name="growth-center"
        options={{
          title: t("tabs.growthCenter"),
          tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} />,
          tabBarTestID: "tab-growth-center",
          tabBarAccessibilityLabel: "Growth Center",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          tabBarTestID: "tab-profile",
          tabBarAccessibilityLabel: "Profile",
        }}
      />
    </Tabs>
  );
}
