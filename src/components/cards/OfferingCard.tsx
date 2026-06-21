/**
 * OfferingCard — Gluestack composition for an offering list item.
 * Used in FindOfferingsScreen (main list) and Favorites (Offerings sub-tab).
 *
 * Fields (web parity):
 *   image, "Offerings" badge, favorite heart (top-right),
 *   specialist avatar strip (up to 2 + "+N" overflow),
 *   title, rating stars (login-gated),
 *   description (2-line), location city, fees ("From $min"),
 *   session duration ("<n> min"), available online ("Yes"/"No").
 *
 * No compare (offerings are NOT comparable per spec).
 */

import React from "react";
import { View, Image, Pressable } from "react-native";
import { Heart, MapPin, Clock, DollarSign, Wifi, WifiOff, Layers } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/cards/RatingStars";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useLocalization } from "@/hooks/useLocalization";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpecialistPreview {
  name?: string;
  avatarUrl?: string | null;
}

export interface OfferingCardProps {
  id: string | number;
  imageSrc?: string | null;
  title: string;
  description?: string;
  city?: string;
  sessionDuration?: string | number | null;
  price?: number | null;
  language?: string;
  rating?: number;
  availableOnline?: boolean | null;
  specialists?: SpecialistPreview[];
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onPrimaryClick?: () => void;
  primaryLabel?: string;
}

// ─── Specialist avatar strip (up to 2 + overflow badge) ──────────────────────

const MAX_VISIBLE = 2;

function SpecialistStrip({ specialists }: { specialists: SpecialistPreview[] }) {
  const colors = useColors();
  const visible = specialists.slice(0, MAX_VISIBLE);
  const overflow = specialists.length - MAX_VISIBLE;
  if (visible.length === 0) return null;

  return (
    <View className="flex-row items-center gap-1 px-4 py-1">
      {visible.map((sp, i) => (
        <View
          key={i}
          style={{ width: 24, height: 24, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}
          className="bg-muted items-center justify-center"
        >
          {sp.avatarUrl ? (
            <Image source={{ uri: sp.avatarUrl }} style={{ width: 24, height: 24 }} />
          ) : (
            <Text className="text-xs text-muted-foreground font-bold">
              {sp.name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          )}
        </View>
      ))}
      {overflow > 0 && (
        <View
          className="bg-muted items-center justify-center"
          style={{ width: 24, height: 24, borderRadius: 12 }}
        >
          <Text className="text-xs text-muted-foreground font-semibold">+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BANNER_HEIGHT = 128;

// ─── Main card ────────────────────────────────────────────────────────────────

export function OfferingCard({
  imageSrc,
  title,
  description,
  city,
  sessionDuration,
  price,
  rating = 0,
  availableOnline,
  specialists = [],
  isFavorite = false,
  onToggleFavorite,
  onPrimaryClick,
  primaryLabel,
}: OfferingCardProps) {
  const colors = useColors();
  const { t } = useCustomTranslation();
  const { formatCurrency } = useLocalization();

  const ctaLabel = primaryLabel ?? t("favorites.checkOffering");

  const durationLabel =
    sessionDuration != null && sessionDuration !== "-" && sessionDuration !== ""
      ? `${sessionDuration} ${t("min")}`
      : null;

  const priceLabel =
    price != null && price > 0
      ? `${t("from")} ${formatCurrency(price, "USD")}`
      : null;

  const onlineLabel =
    availableOnline === true
      ? t("yes")
      : availableOnline === false
      ? t("no")
      : null;

  return (
    <View className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* Banner image */}
      {imageSrc ? (
        <Image
          source={{ uri: imageSrc }}
          style={{ width: "100%", height: BANNER_HEIGHT }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="w-full bg-muted items-center justify-center"
          style={{ height: BANNER_HEIGHT }}
        >
          <Layers size={26} color={colors.mutedForeground} />
        </View>
      )}

      {/* Badge row + heart */}
      <View className="flex-row items-center justify-between px-4 pt-3 pb-1">
        {/* "Offerings" badge */}
        <View className="border border-secondary bg-lightgreen rounded-full px-2 py-0.5">
          <Text className="text-foreground text-xs font-semibold">{t("offering")}</Text>
        </View>
        {/* Favorite heart */}
        {onToggleFavorite && (
          <Pressable onPress={onToggleFavorite} hitSlop={8} accessibilityRole="button">
            <Heart
              size={20}
              color={isFavorite ? colors.destructive : colors.mutedForeground}
              fill={isFavorite ? colors.destructive : "transparent"}
            />
          </Pressable>
        )}
      </View>

      {/* Specialist avatar strip */}
      {specialists.length > 0 && <SpecialistStrip specialists={specialists} />}

      {/* Title */}
      <Heading size="sm" className="text-foreground px-4 pt-1 pb-1" numberOfLines={2}>
        {title}
      </Heading>

      {/* Rating stars (only when > 0, login-gated by caller) */}
      {rating > 0 && (
        <View className="px-4 pb-1">
          <RatingStars value={rating} size={13} />
        </View>
      )}

      {/* Description */}
      {description ? (
        <Text className="text-sm text-muted-foreground px-4 pb-2" numberOfLines={2}>
          {description}
        </Text>
      ) : null}

      {/* Meta chips */}
      <View className="flex-row flex-wrap gap-x-3 gap-y-1 px-4 pb-3 items-center">
        {city && city !== "-" && (
          <View className="flex-row items-center gap-1">
            <MapPin size={11} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">{city}</Text>
          </View>
        )}
        {priceLabel && (
          <View className="flex-row items-center gap-1">
            <DollarSign size={11} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">{priceLabel}</Text>
          </View>
        )}
        {durationLabel && (
          <View className="flex-row items-center gap-1">
            <Clock size={11} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">{durationLabel}</Text>
          </View>
        )}
        {onlineLabel && (
          <View className="flex-row items-center gap-1">
            {availableOnline ? (
              <Wifi size={11} color={colors.mutedForeground} />
            ) : (
              <WifiOff size={11} color={colors.mutedForeground} />
            )}
            <Text className="text-xs text-muted-foreground">
              {t("availableOnline")}: {onlineLabel}
            </Text>
          </View>
        )}
      </View>

      {/* CTA */}
      <View className="px-4 pb-4">
        <Button label={ctaLabel} action="primary" onPress={onPrimaryClick} className="h-11" />
      </View>
    </View>
  );
}
