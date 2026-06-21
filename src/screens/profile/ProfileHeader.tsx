/**
 * ProfileHeader — gradient hero band + avatar + user name + role/email.
 *
 * - Prussian → turquoise gradient (top-to-bottom, mirrors web).
 * - Gradient height 160px (was 120px) for more visual weight.
 * - Avatar overlaps the band bottom; tappable to change photo.
 * - Camera overlay wrapped in usePressScale for tactile feedback.
 * - Name: Heading size lg; second line: role or email in text-muted-foreground text-sm.
 * - RTL: single inline flexDirection; no duplicate NativeWind flex-row-reverse.
 */

import { useState } from "react";
import { View, Pressable, Image, ActivityIndicator, Platform } from "react-native";
import Animated from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";
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

const AVATAR_SIZE = 110;

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

  const subtitle = role || email || user?.email || "";

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
    <View>
      {/* Gradient hero band — 160px */}
      <GradientView
        colors={[brand.prussian, brand.turquoise]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ height: 160 }}
      />

      {/* Avatar row overlapping the band — pt-2 so avatar doesn't clip gradient edge */}
      <View
        style={{
          marginTop: -(AVATAR_SIZE / 2),
          paddingTop: 8,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: isRtl ? "row-reverse" : "row",
          alignItems: "flex-end",
          gap: 16,
        }}
      >
        {/* Avatar — camera overlay has press feedback */}
        <Animated.View style={cameraAnimStyle}>
          <Pressable
            onPress={handlePickAvatar}
            onPressIn={cameraPressIn}
            onPressOut={cameraPressOut}
            disabled={uploading}
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
              overflow: "hidden",
              borderWidth: 3,
              borderColor: colors.background,
            }}
            accessibilityRole="button"
            accessibilityLabel={t("profileChangePhoto")}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, backgroundColor: colors.secondary }}
                className="items-center justify-center"
              >
                <Text className="text-primary-foreground text-4xl font-bold">
                  {(firstName?.[0] ?? user?.name?.[0] ?? "U").toUpperCase()}
                </Text>
              </View>
            )}

            {/* Camera overlay */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 32,
                backgroundColor: SCRIM_45,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.onOverlay} />
              ) : (
                <Camera size={16} color={colors.onOverlay} />
              )}
            </View>
          </Pressable>
        </Animated.View>

        {/* Name + subtitle */}
        <View className="flex-1 pb-2">
          <Heading size="lg" numberOfLines={2} className="text-foreground">
            {displayName}
          </Heading>
          {subtitle ? (
            <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
