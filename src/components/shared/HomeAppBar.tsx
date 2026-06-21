/**
 * HomeAppBar — top bar for the home screen.
 *
 * Left side:  UniFind wordmark (real brand asset — white variant on prussian).
 * Right side: language toggle pill + avatar/sign-in button.
 *
 * Design: floats over the hero gradient (transparent background + the hero
 * provides the visual surface). Sits inside SafeAreaView so it's below the
 * status bar. RTL-aware.
 */

import { View, Pressable, Image } from "react-native";
import { User, Globe } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { Logo } from "@/components/shared/Logo";

interface HomeAppBarProps {
  onLanguageToggle?: () => void;
  onProfilePress?: () => void;
}

export function HomeAppBar({ onLanguageToggle, onProfilePress }: HomeAppBarProps) {
  const { isRtl, lang } = useCustomTranslation();
  const colors = useColors();
  const { isLoggedIn, user } = useAuthStore();

  return (
    <View
      className={`flex-row items-center justify-between px-5 py-3 ${isRtl ? "flex-row-reverse" : ""}`}
    >
      {/* Wordmark — real brand asset, white variant on prussian surface */}
      <Logo variant="white" height={26} />

      {/* Right actions */}
      <View className={`flex-row items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        {/* Language toggle */}
        <Pressable
          onPress={onLanguageToggle}
          hitSlop={8}
          accessibilityRole="button"
          className="flex-row items-center gap-1 bg-white/15 rounded-full px-3 py-1.5"
        >
          <Globe size={12} color={colors.onOverlay} />
          <Text className="text-white text-xs font-semibold uppercase tracking-wide">
            {lang === "ar" ? "EN" : "AR"}
          </Text>
        </Pressable>

        {/* Avatar / Sign in */}
        <Pressable
          onPress={onProfilePress}
          hitSlop={8}
          accessibilityRole="button"
          className="w-9 h-9 rounded-full bg-white/20 items-center justify-center overflow-hidden"
        >
          {isLoggedIn && user?.picture ? (
            <Image
              source={{ uri: user.picture }}
              style={{ width: 36, height: 36 }}
              resizeMode="cover"
            />
          ) : (
            <User size={17} color={colors.onOverlay} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
