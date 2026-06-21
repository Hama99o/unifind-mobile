/**
 * InstitutionCard — Gluestack composition for an institution list item.
 * Full web UFCard2 parity:
 *   cover image · ranking badge (#position + rankingCategory) ·
 *   favorite heart (top-right) · logo · name · rating stars · description ·
 *   location (city, country) · fees ($min–$max from tuition[]) ·
 *   "Check Institution" primary CTA · "Add to Compare"/"In Compare List" secondary.
 *
 * Used in: Find Institutions list, Favorites tab.
 *
 * Design fixes:
 *   - Cover placeholder: bg-primary with primaryForeground icon (prussian fill, white icon)
 *     — visually distinct and branded, avoids the grey-on-grey look
 *   - Ranking badge: bg-secondary (turquoise) + text-foreground — clear contrast
 *   - Logo fallback: bg-muted + Building2 icon in muted-foreground
 *   - Description: leading-relaxed for readability
 *   - Actions separated from content by border-t + consistent pt-3
 *   - Buttons: 44px height for ergonomic touch targets
 *   - Generous p-4 padding throughout
 *
 * RTL: ranking badge swaps to start side; favorite heart swaps to start side.
 * Inline style objects used for RTL-inset (NativeWind purge-safe).
 */

import { View, Image, Pressable, StyleSheet } from "react-native";
import {
  Heart,
  MapPin,
  DollarSign,
  Building2,
  Award,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/cards/RatingStars";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

export interface InstitutionRankingBadge {
  position?: number;
  rankingCategory?: string;
  name?: string;
}

export interface InstitutionCardProps {
  documentId: string;
  name: string;
  type?: string;
  location?: string;
  description?: string;
  logoSrc?: string;
  coverSrc?: string;
  fees?: string;
  rating?: number;
  isFavorite?: boolean;
  isCompared?: boolean;
  rankings?: InstitutionRankingBadge[];
  onToggleFavorite?: () => void;
  onAddToCompare?: () => void;
  onPrimaryClick?: () => void;
  compareLabel?: string;
  primaryLabel?: string;
}

const COVER_HEIGHT = 110;

export function InstitutionCard({
  name,
  type,
  location,
  description,
  logoSrc,
  coverSrc,
  fees,
  rating = 0,
  isFavorite,
  isCompared,
  rankings = [],
  onToggleFavorite,
  onAddToCompare,
  onPrimaryClick,
  compareLabel,
  primaryLabel,
}: InstitutionCardProps) {
  const colors = useColors();
  const { t, isRtl } = useCustomTranslation();

  // Show up to 2 ranking badges with position
  const topRankings = rankings
    .filter((r) => r.position && r.position > 0)
    .slice(0, 2);

  // RTL: badges sit on start side; heart on end side. Use inline styles (purge-safe).
  const badgeInset: { position: "absolute"; top: number; right?: number; left?: number } = isRtl
    ? { position: "absolute", top: 8, right: 8 }
    : { position: "absolute", top: 8, left: 8 };
  const favInset: { position: "absolute"; top: number; right?: number; left?: number } = isRtl
    ? { position: "absolute", top: 8, left: 8 }
    : { position: "absolute", top: 8, right: 8 };

  return (
    <View
      className="bg-card rounded-2xl border border-border overflow-hidden"
      style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
    >
      {/* Cover image — fixed height to avoid layout pop */}
      <View style={{ height: COVER_HEIGHT }}>
        {coverSrc ? (
          <Image
            source={{ uri: coverSrc }}
            style={{ width: "100%", height: COVER_HEIGHT }}
            resizeMode="cover"
          />
        ) : (
          // Prussian brand fill with white icon — clear, branded placeholder
          <View
            className="w-full bg-primary items-center justify-center"
            style={{ height: COVER_HEIGHT }}
          >
            <Building2 size={32} color={colors.primaryForeground} />
          </View>
        )}

        {/* Ranking badges — RTL-aware, secondary (turquoise) background */}
        {topRankings.length > 0 && (
          <View style={[badgeInset, styles.badgeColumn]}>
            {topRankings.map((r, i) => (
              <View
                key={i}
                className="flex-row items-center gap-1 bg-secondary rounded-full px-2 py-0.5"
              >
                <Award size={9} color={colors.foreground} />
                <Text className="text-foreground font-bold" style={{ fontSize: 10 }}>
                  #{r.position}
                  {r.rankingCategory ? ` ${r.rankingCategory}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Favorite heart — pill background for legibility over cover images */}
        {onToggleFavorite && (
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={10}
            style={favInset}
            className="bg-card/90 rounded-full p-1.5"
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              size={18}
              color={isFavorite ? colors.destructive : colors.mutedForeground}
              fill={isFavorite ? colors.destructive : "transparent"}
            />
          </Pressable>
        )}
      </View>

      {/* Logo + name row */}
      <View
        className={`flex-row items-start px-4 pt-3 pb-1 gap-3 ${isRtl ? "flex-row-reverse" : ""}`}
      >
        {logoSrc ? (
          <Image
            source={{ uri: logoSrc }}
            style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: colors.muted }}
            resizeMode="contain"
          />
        ) : (
          <View className="w-11 h-11 rounded-lg bg-muted items-center justify-center">
            <Building2 size={20} color={colors.mutedForeground} />
          </View>
        )}
        <View className="flex-1">
          <Heading
            size="sm"
            className={`text-foreground leading-snug ${isRtl ? "text-right" : ""}`}
            numberOfLines={2}
          >
            {name}
          </Heading>
          {type ? (
            <Text
              className={`text-xs text-muted-foreground ${isRtl ? "text-right" : ""}`}
              numberOfLines={1}
            >
              {type}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Rating stars */}
      {rating > 0 && (
        <View className={`px-4 pb-1 ${isRtl ? "items-end" : ""}`}>
          <RatingStars value={rating} size={13} />
        </View>
      )}

      {/* Description — 3-line clamp, relaxed line-height */}
      {description ? (
        <Text
          className={`text-sm text-muted-foreground px-4 pb-3 leading-relaxed ${isRtl ? "text-right" : ""}`}
          numberOfLines={3}
        >
          {description}
        </Text>
      ) : null}

      {/* Meta row — location + fees */}
      {(location || (fees && fees !== "-")) && (
        <View
          className={`flex-row flex-wrap gap-x-4 gap-y-1 px-4 pb-3 items-center ${isRtl ? "flex-row-reverse" : ""}`}
        >
          {location ? (
            <View className={`flex-row items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
              <MapPin size={12} color={colors.mutedForeground} />
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}
          {fees && fees !== "-" ? (
            <View className={`flex-row items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
              <DollarSign size={12} color={colors.mutedForeground} />
              <Text className="text-xs text-muted-foreground">{fees}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Actions — border-t separator for visual breathing room */}
      <View className={`flex-row gap-2 px-4 pb-4 border-t border-border pt-3 ${isRtl ? "flex-row-reverse" : ""}`}>
        <View className="flex-1">
          <Button
            label={isCompared ? t("inCompareList") : (compareLabel ?? t("addToCompare"))}
            variant="outline"
            action="primary"
            onPress={onAddToCompare}
            style={{ height: 44 }}
          />
        </View>
        <View className="flex-1">
          <Button
            label={primaryLabel ?? t("checkInstitution")}
            action="primary"
            onPress={onPrimaryClick}
            style={{ height: 44 }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeColumn: {
    gap: 4,
  },
});
