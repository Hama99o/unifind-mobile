/**
 * ProfileTabBar — horizontal scrollable tab bar for all 7 profile tabs.
 *
 * Tabs: Profile Information | Account Credentials | About Me |
 *       Activity | Favorites | Comparisons | Bookings
 *
 * Sign-out lives in the compact ProfileHeader (QA 2026-11-10 DESIGN-05).
 * Active chip bg-lightgreen (token via brand). Tab Pressables wrapped in usePressScale.
 * paddingVertical 10→12 for ≥44px touch floor.
 * RTL-safe, theme tokens only.
 */

import { useEffect, useRef } from "react";
import { ScrollView, Pressable, View, type LayoutRectangle } from "react-native";
import { scrollXToReveal } from "@/utils/scrollIntoView";
import Animated from "react-native-reanimated";
import {
  User, Shield, BookOpen, Activity,
  Heart, ArrowLeftRight, Clock,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { usePressScale } from "@/hooks/usePressScale";
import { brand } from "@/config/theme";

export type ProfileTab =
  | "profile"
  | "credentials"
  | "about"
  | "activity"
  | "favorites"
  | "comparisons"
  | "bookings";

interface Tab {
  id: ProfileTab;
  labelKey: string;
  Icon: typeof User;
}

const TABS: Tab[] = [
  { id: "profile",      labelKey: "profileInformation",   Icon: User },
  { id: "credentials",  labelKey: "accountCredentials",   Icon: Shield },
  { id: "about",        labelKey: "aboutMe",               Icon: BookOpen },
  { id: "activity",     labelKey: "activity",              Icon: Activity },
  { id: "favorites",    labelKey: "myFavorites",           Icon: Heart },
  { id: "comparisons",  labelKey: "myComparisons",         Icon: ArrowLeftRight },
  { id: "bookings",     labelKey: "myBookings",            Icon: Clock },
];

interface ProfileTabBarProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

// ─── Single tab pill with press scale ────────────────────────────────────────

function TabPillItem({
  tab,
  isActive,
  onPress,
  isRtl,
  t,
}: {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
  isRtl: boolean;
  t: (key: string) => string;
}) {
  const colors = useColors();
  const { animStyle, handlePressIn, handlePressOut } = usePressScale();

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          flexDirection: isRtl ? "row-reverse" : "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 12,
          backgroundColor: isActive ? brand.lightGreen : "transparent",
          marginHorizontal: 2,
        }}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={t(tab.labelKey)}
        testID={`profile-tab-${tab.id}`}
      >
        <tab.Icon
          size={17}
          color={isActive ? brand.prussian : colors.mutedForeground}
        />
        <Text
          className={`text-sm ${
            isActive
              ? "font-bold text-foreground"
              : "text-muted-foreground"
          }`}
          numberOfLines={1}
        >
          {t(tab.labelKey)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main tab bar ─────────────────────────────────────────────────────────────

export function ProfileTabBar({ activeTab, onTabChange }: ProfileTabBarProps) {
  const { t, isRtl } = useCustomTranslation();

  // Keep the active tab on screen: in Arabic the reversed row opened scrolled
  // to the far end with the active tab hidden (QA 2026-11-10).
  const scrollRef = useRef<ScrollView>(null);
  const layouts = useRef<Record<string, LayoutRectangle>>({});
  const scrollX = useRef(0);
  const viewport = useRef(0);
  const content = useRef(0);
  const reveal = (animated: boolean) => {
    const item = layouts.current[activeTab];
    if (!item || !viewport.current || !content.current) return;
    const x = scrollXToReveal(item, scrollX.current, viewport.current, content.current, 16);
    if (x !== scrollX.current) {
      scrollX.current = x;
      scrollRef.current?.scrollTo({ x, animated });
    }
  };
  useEffect(() => reveal(true), [activeTab, isRtl]);

  return (
    <>
      {/* Tab scroll card */}
      <View className="bg-card rounded-2xl overflow-hidden mx-4 mt-4 shadow-sm">
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={32}
          onScroll={(e) => {
            scrollX.current = e.nativeEvent.contentOffset.x;
          }}
          onLayout={(e) => {
            viewport.current = e.nativeEvent.layout.width;
            reveal(false);
          }}
          onContentSizeChange={(w) => {
            content.current = w;
            reveal(false);
          }}
          contentContainerStyle={{
            paddingHorizontal: 4,
            paddingVertical: 4,
            flexDirection: isRtl ? "row-reverse" : "row",
          }}
        >
          {TABS.map((tab) => (
            <View
              key={tab.id}
              onLayout={(e) => {
                layouts.current[tab.id] = e.nativeEvent.layout;
                if (tab.id === activeTab) reveal(false);
              }}
            >
            <TabPillItem
              tab={tab}
              isActive={tab.id === activeTab}
              onPress={() => onTabChange(tab.id)}
              isRtl={isRtl}
              t={t}
            />
            </View>
          ))}
        </ScrollView>
      </View>

    </>
  );
}
