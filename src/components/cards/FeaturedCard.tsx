/**
 * FeaturedCard — premium card for Featured Offerings and Institutions carousels.
 *
 * Design (equal-height contract):
 *  - Fixed card width: 280px, fixed total height: 380px.
 *  - Image block: exactly 150px tall.
 *  - Title block below the image: exactly 2 lines, fixed height 48px.
 *  - Category chip row: fixed height 28px.
 *  - Description block: exactly 2 lines, fixed height 36px.
 *  - "Know More" is always pinned to the bottom of the card.
 *  - Logo (institution cards) floats top-start of image with a white pill background.
 *  - Press scale feedback (Reanimated).
 *
 * Every card renders at the same height regardless of content length.
 * Used by: FeaturedOfferingsSection · FeaturedInstitutionsSection
 */

import { View, Image } from "react-native";
import { Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { GradientView } from "@/components/shared/GradientView";
import {
  Tag, Sparkles, BookOpen, Briefcase, GraduationCap, Mic,
  Music, Palette, Code, Users, Heart, Globe, TrendingUp,
  Lightbulb, ChevronRight, ChevronLeft, type LucideIcon,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";

// ─── Layout constants ─────────────────────────────────────────────────────────
/** Total card width — matches FeaturedOfferingsSection / FeaturedInstitutionsSection CARD_WIDTH */
const CARD_W = 280;
/** Fixed image height */
const IMG_H = 150;
/** Fixed title block height — accommodates exactly 2 lines of sm Heading */
const TITLE_H = 48;
/** Fixed chip row height */
const CHIP_H = 28;
/** Fixed 2-line description height */
const DESC_H = 36;
/** Internal padding used in the content block */
const CONTENT_PX = 14;
const CONTENT_PY_TOP = 10;
const CONTENT_PY_BOT = 12;
const GAP = 6;
/** "Know More" row height */
const CTA_H = 20;

// ─── Category icon map ────────────────────────────────────────────────────────
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  tag: Tag, sparkles: Sparkles, book: BookOpen, "book-open": BookOpen,
  briefcase: Briefcase, "graduation-cap": GraduationCap, microphone: Mic,
  music: Music, palette: Palette, code: Code, users: Users, heart: Heart,
  globe: Globe, "chart-line": TrendingUp, "trending-up": TrendingUp,
  lightbulb: Lightbulb, star: Sparkles, pencil: Palette, laptop: Code,
};

function resolveCategoryIcon(iconName: string | undefined | null): LucideIcon {
  if (!iconName) return Tag;
  return CATEGORY_ICON_MAP[iconName.toLowerCase().trim()] ?? Tag;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FeaturedCardProps {
  imageUrl: string;
  logoUrl?: string;
  categoryLabel?: string;
  categoryIcon?: string;
  title: string;
  description: string;
  subLine?: string;
  badge: string;
  onPress?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FeaturedCard({
  imageUrl, logoUrl, categoryLabel, categoryIcon,
  title, description, subLine, badge, onPress,
}: FeaturedCardProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const CategoryIcon = resolveCategoryIcon(categoryIcon);
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handlePressIn = () => { scale.value = withTiming(0.97, { duration: 100 }); };
  const handlePressOut = () => { scale.value = withTiming(1, { duration: 150 }); };

  return (
    <Animated.View
      style={[animStyle, {
        width: CARD_W,
        marginRight: isRtl ? 0 : 12,
        marginLeft: isRtl ? 12 : 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 12,
        elevation: 6,
      }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="bg-card rounded-2xl overflow-hidden"
        style={{ width: CARD_W }}
        accessibilityRole="button"
      >
        {/* ── Image block: fixed 150px ─────────────────────────────────────── */}
        <View style={{ width: CARD_W, height: IMG_H }}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: CARD_W, height: IMG_H }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ width: CARD_W, height: IMG_H }} className="bg-muted" />
          )}

          {/* Subtle bottom scrim — improves contrast if badge or logo overlaps */}
          <GradientView
            colors={["transparent", "rgba(2,48,85,0.55)"]}
            locations={[0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: IMG_H / 2 }}
          />

          {/* Badge — top trailing corner */}
          <View
            className={`absolute top-3 ${isRtl ? "left-3" : "right-3"} bg-accent rounded-full px-2.5 py-0.5`}
          >
            <Text className="text-white text-[10px] font-bold">{badge}</Text>
          </View>

          {/* Logo (institution cards) — top leading corner, white pill */}
          {logoUrl ? (
            <View
              className={`absolute top-3 ${isRtl ? "right-3" : "left-3"} bg-white/90 rounded-lg p-1`}
              style={{ width: 56, height: 32 }}
            >
              <Image source={{ uri: logoUrl }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
            </View>
          ) : null}
        </View>

        {/* ── Content block: fixed structure below the image ───────────────── */}
        <View
          style={{
            paddingHorizontal: CONTENT_PX,
            paddingTop: CONTENT_PY_TOP,
            paddingBottom: CONTENT_PY_BOT,
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          {/* Title: fixed 48px, 2 lines max */}
          <View style={{ height: TITLE_H, justifyContent: "flex-start" }}>
            <Heading
              size="sm"
              numberOfLines={2}
              className={`text-typography-900 font-bold leading-snug ${isRtl ? "text-right" : ""}`}
            >
              {title}
            </Heading>
          </View>

          {/* Middle block: chip + description — sits between title and CTA */}
          <View style={{ gap: GAP }}>
            {/* Category chip row: fixed 28px */}
            <View style={{ height: CHIP_H, justifyContent: "center" }}>
              {categoryLabel ? (
                <View
                  className={`flex-row items-center gap-1.5 self-start bg-turquoise/12 rounded-full px-2.5 py-1 ${isRtl ? "flex-row-reverse self-end" : ""}`}
                >
                  <CategoryIcon size={11} color={colors.primary} />
                  <Text className="text-xs text-primary font-semibold uppercase tracking-wide">
                    {categoryLabel}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Description: fixed 36px, 2 lines max */}
            <View style={{ height: DESC_H }}>
              <Text
                className={`text-xs text-typography-500 leading-relaxed ${isRtl ? "text-right" : ""}`}
                numberOfLines={2}
              >
                {description}
              </Text>
            </View>

            {/* subLine — optional single muted line (location etc.) */}
            {subLine ? (
              <Text
                className={`text-xs text-typography-500 ${isRtl ? "text-right" : ""}`}
                numberOfLines={1}
              >
                {subLine}
              </Text>
            ) : null}
          </View>

          {/* Know More — always pinned at the bottom via space-between */}
          <View
            className={`flex-row items-center gap-0.5 ${isRtl ? "flex-row-reverse self-end" : "self-start"}`}
            style={{ height: CTA_H }}
          >
            <Text className="text-primary text-xs font-semibold">{t("knowMore")}</Text>
            <ArrowIcon size={13} color={colors.primary} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
