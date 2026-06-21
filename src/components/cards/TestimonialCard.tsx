/**
 * TestimonialCard — rich, trustworthy testimonial card.
 *
 * Design:
 *  - Institution/offering image header (h-28) with gradient scrim.
 *  - Rating stars prominent, just below the image.
 *  - Avatar (or initial monogram) + name + program in a clean row.
 *  - Quote block: 3 lines max, italic, readable size.
 *  - Press scale feedback.
 *  - RTL-safe.
 *
 * Used by TestimonialsSection.
 */

import { View, Image } from "react-native";
import { Pressable } from "react-native";
import Animated from "react-native-reanimated";
import { usePressScale } from "@/hooks/usePressScale";
import { GradientView } from "@/components/shared/GradientView";
import { Quote, ChevronRight, ChevronLeft } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { RatingStars } from "@/components/cards/RatingStars";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { brand, SHADOW_COLOR } from "@/config/theme";

export interface TestimonialCardProps {
  imageUrl: string;
  logoUrl?: string;
  title: string;
  rating: number;
  testimonial: string;
  userName: string;
  userAvatar: string | null;
  userProgram?: string;
  onPress?: () => void;
}

export function TestimonialCard({
  imageUrl, logoUrl, title, rating, testimonial,
  userName, userAvatar, userProgram, onPress,
}: TestimonialCardProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  const { animStyle, handlePressIn, handlePressOut } = usePressScale();

  return (
    <Animated.View
      style={[animStyle, {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
        elevation: 4,
        marginRight: isRtl ? 0 : 12,
        marginLeft: isRtl ? 12 : 0,
      }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="bg-card rounded-2xl overflow-hidden w-72"
        accessibilityRole="button"
      >
        {/* Image header with gradient scrim */}
        <View className="w-full h-28 relative">
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full bg-muted" />
          )}
          <GradientView
            colors={["transparent", `${brand.prussian}B3`]}
            locations={[0.3, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 0 }}
          />
          {/* Logo */}
          {logoUrl ? (
            <View
              className={`absolute bottom-2 ${isRtl ? "right-2" : "left-2"} w-16 h-9 bg-white/90 rounded-lg p-1`}
            >
              <Image source={{ uri: logoUrl }} className="w-full h-full" resizeMode="contain" />
            </View>
          ) : null}
        </View>

        {/* Body */}
        <View className="px-4 pb-4 pt-3 gap-2.5">
          {/* Institution / offering title */}
          <Heading size="sm" numberOfLines={1} className={`text-card-foreground font-semibold ${isRtl ? "text-right" : ""}`}>
            {title}
          </Heading>

          {/* Rating row — stars prominent */}
          <View className={`flex-row items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <RatingStars value={rating} size={14} />
            <Text className="text-xs font-bold text-foreground">{rating.toFixed(1)}</Text>
          </View>

          {/* Quote */}
          <View className={`flex-row items-start gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Quote size={12} color={colors.mutedForeground} style={{ marginTop: 2, flexShrink: 0 }} />
            <Text
              className={`text-xs text-muted-foreground italic leading-relaxed flex-1 ${isRtl ? "text-right" : ""}`}
              numberOfLines={3}
            >
              {testimonial || "-"}
            </Text>
          </View>

          {/* Divider */}
          <View className="h-px bg-border" />

          {/* User info row */}
          <View className={`flex-row items-center gap-2.5 ${isRtl ? "flex-row-reverse" : ""}`}>
            <View className="w-9 h-9 rounded-full overflow-hidden bg-primary items-center justify-center flex-shrink-0">
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-primary-foreground text-sm font-bold">
                  {userName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View className="flex-1 min-w-0">
              <Text
                className={`text-sm font-semibold text-card-foreground ${isRtl ? "text-right" : ""}`}
                numberOfLines={1}
              >
                {userName}
              </Text>
              {userProgram ? (
                <Text
                  className={`text-xs text-muted-foreground ${isRtl ? "text-right" : ""}`}
                  numberOfLines={1}
                >
                  {userProgram}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Know More */}
          {onPress ? (
            <View
              className={`flex-row items-center gap-0.5 ${isRtl ? "flex-row-reverse self-end" : "self-start"}`}
            >
              <Text className="text-primary text-xs font-semibold">{t("knowMore")}</Text>
              <ArrowIcon size={12} color={colors.primary} />
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}
