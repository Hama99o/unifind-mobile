/**
 * ProfileTabBar — horizontal scrollable tab bar for all 7 profile tabs + sign-out.
 *
 * Tabs: Profile Information | Account Credentials | About Me |
 *       Activity | Favorites | Comparisons | Bookings
 *
 * Sign-out is in its OWN mt-3 mx-4 bg-card rounded-2xl container OUTSIDE the scroll card.
 * Active chip bg-lightgreen (token via brand). Tab Pressables wrapped in usePressScale.
 * paddingVertical 10→12 for ≥44px touch floor.
 * RTL-safe, theme tokens only.
 */

import { ScrollView, Pressable, View } from "react-native";
import Animated from "react-native-reanimated";
import {
  User, Shield, BookOpen, Activity,
  Heart, ArrowLeftRight, Clock, LogOut,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { usePressScale } from "@/hooks/usePressScale";
import { brand } from "@/config/theme";
import { confirmAlert } from "@/components/ui/alert-dialog";
import { authService } from "@/services/authService";

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

// ─── Sign-out row with press scale ───────────────────────────────────────────

function SignOutRow({ onPress, isRtl }: { onPress: () => void; isRtl: boolean }) {
  const colors = useColors();
  const { t } = useCustomTranslation();
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
          gap: 10,
          paddingHorizontal: 18,
          paddingVertical: 14,
        }}
        accessibilityRole="button"
        accessibilityLabel={t("signOut")}
        testID="profile-sign-out"
      >
        <LogOut size={18} color={colors.destructive} />
        <Text className="text-destructive font-semibold text-sm">{t("signOut")}</Text>
      </Pressable>
    </Animated.View>
  );
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

  const handleSignOut = () => {
    confirmAlert(t("signOut"), t("signOutConfirmation"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("signOut"),
        style: "destructive",
        onPress: () => {
          authService.logout().catch(() => {});
        },
      },
    ]);
  };

  return (
    <>
      {/* Tab scroll card */}
      <View className="bg-card rounded-2xl overflow-hidden mx-4 mt-4 shadow-sm">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 4,
            paddingVertical: 4,
            flexDirection: isRtl ? "row-reverse" : "row",
          }}
        >
          {TABS.map((tab) => (
            <TabPillItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTab}
              onPress={() => onTabChange(tab.id)}
              isRtl={isRtl}
              t={t}
            />
          ))}
        </ScrollView>
      </View>

      {/* Sign-out — own card OUTSIDE the scroll card */}
      <View className="mt-3 mx-4 bg-card rounded-2xl overflow-hidden">
        <SignOutRow onPress={handleSignOut} isRtl={isRtl} />
      </View>
    </>
  );
}
