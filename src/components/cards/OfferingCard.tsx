/**
 * OfferingCard — Gluestack composition for an offering list item.
 * Used in FindOfferingsScreen (main list) and Favorites (Offerings sub-tab).
 *
 * Visual hierarchy (top → bottom):
 *   1. Banner image (128px) — with fallback bg-lightgreen + icon
 *   2. Category badge ("Offering", secondary pill) + heart — inside the card body
 *   3. Specialist avatar strip (up to 2 + "+N" overflow badge)
 *   4. Title (Heading/sm) + Rating stars
 *   5. Description (2-line, muted) — optional
 *   6. Meta row: city · price · duration · online — small icons, muted text
 *   7. CTA button (primary, full-width, h-44)
 *
 * Design fixes:
 *   - Banner fallback: bg-lightgreen + Layers icon (primary color) — not grey
 *   - "Offering" badge: bg-secondary (turquoise) + text-foreground — not lightgreen
 *     (avoids same-hue-on-same-hue turquoise badge on turquoise chip)
 *   - Meta icons: muted-foreground on white bg = readable (fine at this size/contrast)
 *   - Generous padding: p-4 throughout, pb-4 before CTA
 *   - No compare (offerings are NOT comparable per spec)
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
import { isolateBidi } from "@/utils/catalogFormat";

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
    <View className="flex-row items-center gap-1.5 px-4 pb-1 pt-0.5">
      {visible.map((sp, i) => (
        <View
          key={i}
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            overflow: "hidden",
            borderWidth: 1.5,
            borderColor: colors.border,
          }}
          className="bg-muted items-center justify-center"
        >
          {sp.avatarUrl ? (
            <Image source={{ uri: sp.avatarUrl }} style={{ width: 26, height: 26 }} />
          ) : (
            <Text className="text-xs text-muted-foreground font-bold" style={{ fontSize: 10 }}>
              {sp.name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          )}
        </View>
      ))}
      {overflow > 0 && (
        <View
          className="bg-muted items-center justify-center"
          style={{ width: 26, height: 26, borderRadius: 13 }}
        >
          <Text className="text-muted-foreground font-semibold" style={{ fontSize: 10 }}>
            +{overflow}
          </Text>
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
      ? `${t("from")} ${isolateBidi(formatCurrency(price, "USD"))}`
      : null;

  const onlineLabel =
    availableOnline === true
      ? t("yes")
      : availableOnline === false
      ? t("no")
      : null;

  return (
    <View
      className="bg-card rounded-2xl border border-border overflow-hidden"
      style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
    >
      {/* Banner image — lightgreen fallback so it doesn't look broken */}
      {imageSrc ? (
        <Image
          source={{ uri: imageSrc }}
          style={{ width: "100%", height: BANNER_HEIGHT }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="w-full bg-lightgreen items-center justify-center"
          style={{ height: BANNER_HEIGHT }}
        >
          <Layers size={30} color={colors.primary} />
        </View>
      )}

      {/* Badge row + heart — "Offering" as secondary (turquoise) pill */}
      <View className="flex-row items-center justify-between px-4 pt-3 pb-1.5">
        <View className="bg-secondary rounded-full px-3 py-1">
          <Text className="text-foreground text-xs font-semibold">{t("offering")}</Text>
        </View>
        {onToggleFavorite && (
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
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

      {/* Title + optional rating */}
      <View className="px-4 pt-0.5 pb-1">
        <Heading size="sm" className="text-foreground leading-snug" numberOfLines={2}>
          {title}
        </Heading>
        {rating > 0 && (
          <View className="mt-1">
            <RatingStars value={rating} size={13} />
          </View>
        )}
      </View>

      {/* Description */}
      {description ? (
        <Text className="text-sm text-muted-foreground px-4 pb-3 leading-relaxed" numberOfLines={2}>
          {description}
        </Text>
      ) : null}

      {/* Meta row — compact, spaced, muted */}
      {(city || priceLabel || durationLabel || onlineLabel) && (
        <View className="flex-row flex-wrap gap-x-4 gap-y-1.5 px-4 pb-3 items-center">
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
      )}

      {/* CTA — border-t separator for breathing room */}
      <View className="px-4 pb-4 border-t border-border pt-3">
        <Button label={ctaLabel} action="primary" onPress={onPrimaryClick} style={{ height: 44 }} />
      </View>
    </View>
  );
}
