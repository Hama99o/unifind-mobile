/**
 * ProfileHeader — compact brand row: 64 px avatar inline with name + role/email.
 *
 * - Prussian → turquoise gradient (brand, mirrors web), sized by its content.
 * - Avatar tappable to change photo; camera badge with usePressScale feedback.
 * - Name: Heading md; second line: role or email, both on-overlay (white).
 * - QA 2026-11-10 DESIGN-05: was a 160 px band + 110 px overlapping avatar.
 * - RTL: single inline flexDirection; no duplicate NativeWind flex-row-reverse.
 */

import { useState } from "react";
import { View, Pressable, Image, ActivityIndicator, Platform } from "react-native";
import Animated from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { Camera, LogOut } from "lucide-react-native";
import { GradientView } from "@/components/shared/GradientView";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/stores/authStore";
import { avatarService } from "@/services/avatarService";
import { showToast } from "@/stores/toastStore";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { usePressScale } from "@/hooks/usePressScale";
import { brand, SCRIM_45 } from "@/config/theme";
import { confirmAlert } from "@/components/ui/alert-dialog";
import { authService } from "@/services/authService";

const AVATAR_SIZE = 64;
const BADGE_SIZE = 22;

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  role?: string;
  email?: string;
}

export function ProfileHeader({ firstName, lastName, role, email }: ProfileHeaderProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const [uploading, setUploading] = useState(false);

  const { animStyle: cameraAnimStyle, handlePressIn: cameraPressIn, handlePressOut: cameraPressOut } = usePressScale();

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    user?.name ||
    t("profile.title");

  // A new Auth0 account's name IS its email: show it once.
  const rawSubtitle = role || email || user?.email || "";
  const subtitle = rawSubtitle === displayName ? "" : rawSubtitle;

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

  const avatarUri = user?.picture;

  const handlePickAvatar = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showToast(t("profileAvatarPermissionDenied"));
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setUploading(true);

      await avatarService.uploadAvatar({
        uri: asset.uri,
        type: asset.mimeType ?? "image/jpeg",
        name: asset.fileName ?? "avatar.jpg",
        size: asset.fileSize,
      });

      showToast(t("profileAvatarUpdated"));
    } catch {
      showToast(t("profileAvatarError"));
    } finally {
      setUploading(false);
    }
  };

  return (
    // Compact header (QA 2026-11-10 DESIGN-05): the 160 px band + 110 px
    // overlapping avatar took ~60% of the screen with the tab bar. One short
    // brand-gradient row now: 64 px avatar inline with name + email.
    <GradientView
      colors={[brand.prussian, brand.turquoise]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View
        testID="profile-header-row"
        style={{
          paddingVertical: 14,
          paddingHorizontal: 20,
          flexDirection: isRtl ? "row-reverse" : "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Avatar — tap to change photo; small camera badge with press feedback */}
        <Animated.View style={cameraAnimStyle}>
          <Pressable
            testID="profile-avatar"
            onPress={handlePickAvatar}
            onPressIn={cameraPressIn}
            onPressOut={cameraPressOut}
            disabled={uploading}
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
              borderWidth: 2,
              borderColor: colors.onOverlay,
            }}
            accessibilityRole="button"
            accessibilityLabel={t("profileChangePhoto")}
          >
            <View style={{ flex: 1, borderRadius: AVATAR_SIZE / 2, overflow: "hidden" }}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ flex: 1 }} resizeMode="cover" />
              ) : (
                <View
                  style={{ flex: 1, backgroundColor: colors.secondary }}
                  className="items-center justify-center"
                >
                  <Text className="text-primary-foreground text-2xl font-bold">
                    {(firstName?.[0] ?? user?.name?.[0] ?? "U").toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Camera badge — bottom corner (end side) */}
            <View
              style={{
                position: "absolute",
                bottom: -2,
                [isRtl ? "left" : "right"]: -2,
                width: BADGE_SIZE,
                height: BADGE_SIZE,
                borderRadius: BADGE_SIZE / 2,
                backgroundColor: SCRIM_45,
                borderWidth: 1.5,
                borderColor: colors.onOverlay,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.onOverlay} />
              ) : (
                <Camera size={12} color={colors.onOverlay} />
              )}
            </View>
          </Pressable>
        </Animated.View>

        {/* Name + subtitle */}
        <View style={{ flex: 1, alignItems: isRtl ? "flex-end" : "flex-start" }}>
          <Heading
            size="md"
            numberOfLines={1}
            style={{ color: colors.onOverlay, textAlign: isRtl ? "right" : "left" }}
          >
            {displayName}
          </Heading>
          {subtitle ? (
            <Text
              className="text-sm mt-0.5"
              numberOfLines={1}
              style={{ color: colors.onOverlay, opacity: 0.85, textAlign: isRtl ? "right" : "left" }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Sign-out (was its own ~110 px card under the tab bar) */}
        <Pressable
          testID="profile-sign-out"
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel={t("signOut")}
          hitSlop={8}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: SCRIM_45,
          }}
        >
          {/* Flip on a wrapper View: a transform on the SVG itself hides it on Android */}
          <View style={isRtl ? { transform: [{ scaleX: -1 }] } : undefined}>
            <LogOut size={20} color={colors.onOverlay} />
          </View>
        </Pressable>
      </View>
    </GradientView>
  );
}
