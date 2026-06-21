/**
 * HeroDetailCard — mobile equivalent of UFCard3.
 *
 * Displays: logo, title, subtitle, rating stars + "(N reviews)",
 * favorite heart, share button, up to 3 action buttons.
 *
 * Generic — reused by Institution detail and Program detail.
 * RTL-safe; no hardcoded hex; Gluestack only.
 */

import { View, Image, Pressable, StyleSheet } from "react-native";
import React from "react";
import { Heart, Share2 } from "lucide-react-native";
import { shareLink } from "@/utils/share";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/cards/RatingStars";
import { GradientView } from "@/components/shared/GradientView";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

export interface HeroActionButton {
  label: string;
  variant?: "solid" | "outline";
  action?: "primary" | "secondary" | "destructive";
  onPress: () => void;
  disabled?: boolean;
  /** Optional leading icon rendered before the label */
  leftIcon?: React.ReactNode;
}

export interface HeroDetailCardProps {
  logoSrc?: string;
  title: string;
  subtitle?: string;
  rating?: number;
  nbReviews?: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** Share title (for expo-share / clipboard) */
  shareTitle?: string;
  /** Primary button */
  primaryButton?: HeroActionButton;
  /** Secondary button */
  secondaryButton?: HeroActionButton;
  /** Tertiary button */
  tertiaryButton?: HeroActionButton;
  className?: string;
}

export function HeroDetailCard({
  logoSrc,
  title,
  subtitle,
  rating = 0,
  nbReviews = 0,
  isFavorite = false,
  onToggleFavorite,
  shareTitle,
  primaryButton,
  secondaryButton,
  tertiaryButton,
}: HeroDetailCardProps) {
  const colors = useColors();
  const { t, isRtl } = useCustomTranslation();

  const handleShare = () => {
    const displayTitle = shareTitle ?? title;
    const url =
      typeof window !== "undefined" && window.location?.href
        ? window.location.href
        : `https://unifind.app/share?t=${encodeURIComponent(displayTitle)}`;
    shareLink(url, displayTitle);
  };

  const actionButtons = [primaryButton, secondaryButton, tertiaryButton].filter(
    Boolean
  ) as HeroActionButton[];

  const favSide = isRtl ? "left-3" : "right-3";

  return (
    <View className="bg-card rounded-2xl shadow-md overflow-hidden border border-border">
      {/* Favorite + Share — top corner, layered over the logo area */}
      <View className="relative">
        <View className={`absolute top-3 ${favSide} z-10 flex-row gap-2`}>
          {onToggleFavorite && (
            <Pressable
              onPress={onToggleFavorite}
              hitSlop={10}
              className="bg-background/80 rounded-full p-2 border border-border"
              accessibilityRole="button"
            >
              <Heart
                size={18}
                color={isFavorite ? colors.destructive : colors.mutedForeground}
                fill={isFavorite ? colors.destructive : "transparent"}
              />
            </Pressable>
          )}
          <Pressable
            onPress={handleShare}
            hitSlop={10}
            className="bg-background/80 rounded-full p-2 border border-border"
            accessibilityRole="button"
          >
            <Share2 size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {/* Logo + name */}
      <View className={`flex-row items-start p-4 gap-4 mt-10 ${isRtl ? "flex-row-reverse" : ""}`}>
        {logoSrc ? (
          <View style={{ width: 80, height: 68, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
            {/* Bottom-to-top scrim softens the image edge against the card */}
            <Image
              source={{ uri: logoSrc }}
              style={[StyleSheet.absoluteFillObject, { opacity: 0.55 }]}
              resizeMode="contain"
            />
            <GradientView
              colors={["transparent", colors.background]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
        ) : (
          <View
            className="w-20 h-[68px] rounded-xl bg-muted items-center justify-center border border-border"
          />
        )}

        <View className="flex-1">
          <Heading
            size="md"
            className={`text-foreground ${isRtl ? "text-right" : ""}`}
            numberOfLines={3}
          >
            {title}
          </Heading>
          {subtitle ? (
            <Text
              className={`text-sm text-muted-foreground mt-0.5 ${isRtl ? "text-right" : ""}`}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}

          {/* Stars + review count */}
          <View className={`flex-row items-center gap-2 mt-1 ${isRtl ? "flex-row-reverse" : ""}`}>
            <RatingStars value={rating} size={13} />
            <Text className="text-xs text-muted-foreground">
              {rating > 0 ? `${Number(rating).toFixed(1)}/5` : ""}
            </Text>
            <Text className="text-xs text-muted-foreground">
              ({nbReviews} {t("reviews")})
            </Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      {actionButtons.length > 0 && (
        <View className={`px-4 pb-4 gap-2`}>
          {/* Primary button full width */}
          {primaryButton && (
            primaryButton.leftIcon ? (
              <Pressable
                onPress={primaryButton.onPress}
                disabled={primaryButton.disabled}
                className={`h-12 px-5 rounded-xl flex-row items-center justify-center w-full gap-2 ${
                  primaryButton.variant === "outline"
                    ? "border border-primary"
                    : "bg-primary"
                } ${primaryButton.disabled ? "opacity-50" : ""}`}
              >
                {primaryButton.leftIcon}
                <Text
                  className={`font-semibold ${
                    primaryButton.variant === "outline"
                      ? "text-primary"
                      : "text-primary-foreground"
                  }`}
                >
                  {primaryButton.label}
                </Text>
              </Pressable>
            ) : (
              <Button
                label={primaryButton.label}
                action={primaryButton.action ?? "primary"}
                variant={primaryButton.variant ?? "solid"}
                onPress={primaryButton.onPress}
                disabled={primaryButton.disabled}
                className="w-full"
              />
            )
          )}

          {/* Secondary + tertiary side by side */}
          {(secondaryButton || tertiaryButton) && (
            <View className={`flex-row gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              {secondaryButton && (
                <View className="flex-1">
                  <Button
                    label={secondaryButton.label}
                    action={secondaryButton.action ?? "primary"}
                    variant={secondaryButton.variant ?? "outline"}
                    onPress={secondaryButton.onPress}
                    disabled={secondaryButton.disabled}
                  />
                </View>
              )}
              {tertiaryButton && (
                <View className="flex-1">
                  <Button
                    label={tertiaryButton.label}
                    action={tertiaryButton.action ?? "primary"}
                    variant={tertiaryButton.variant ?? "outline"}
                    onPress={tertiaryButton.onPress}
                    disabled={tertiaryButton.disabled}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
