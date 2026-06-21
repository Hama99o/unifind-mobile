/**
 * InstitutionCard — Gluestack composition for an institution item.
 * Full web UFCard2 parity:
 *   cover image · ranking badge (#position + rankingCategory, turquoise) ·
 *   favorite heart (top-right) · logo · name · rating stars · description ·
 *   location (city, country) · fees ($min–$max from tuition[]) ·
 *   "Check Institution" primary CTA · "Add to Compare"/"In Compare List" secondary.
 *
 * Used in: Find Institutions list, Favorites tab.
 *
 * RTL: ranking badge swaps to start side; favorite heart swaps to start side.
 * Cover image and placeholder share the same height (110) to avoid layout pop.
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

  // RTL: badges sit on start side (right in ar, left in en)
  // Favorite sits on end side (left in ar, right in en)
  // Use inline style objects so NativeWind purge cannot drop dynamic class strings.
  const badgeInset: { position: "absolute"; top: number; right?: number; left?: number } = isRtl
    ? { position: "absolute", top: 8, right: 8 }
    : { position: "absolute", top: 8, left: 8 };
  const favInset: { position: "absolute"; top: number; right?: number; left?: number } = isRtl
    ? { position: "absolute", top: 8, left: 8 }
    : { position: "absolute", top: 8, right: 8 };

  return (
    <View className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* Cover image — fixed height so placeholder doesn't pop */}
      <View className="relative" style={{ height: COVER_HEIGHT }}>
        {coverSrc ? (
          <Image
            source={{ uri: coverSrc }}
            style={{ width: "100%", height: COVER_HEIGHT }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="w-full bg-primary items-center justify-center"
            style={{ height: COVER_HEIGHT }}
          >
            <Building2 size={32} color={colors.primaryForeground} />
          </View>
        )}

        {/* Ranking badges — RTL-aware side via inline style (purge-safe) */}
        {topRankings.length > 0 && (
          <View style={[badgeInset, styles.badgeColumn]}>
            {topRankings.map((r, i) => (
              <View
                key={i}
                className="flex-row items-center gap-1 bg-secondary rounded-full px-2 py-0.5"
              >
                <Award size={10} color={colors.foreground} />
                <Text className="text-xs font-bold text-foreground">
                  #{r.position}
                  {r.rankingCategory ? ` ${r.rankingCategory}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Favorite heart — RTL-aware side via inline style (purge-safe) */}
        {onToggleFavorite && (
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={10}
            style={favInset}
            className="bg-background/80 rounded-full p-1.5"
            accessibilityRole="button"
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
            style={{ width: 44, height: 44, borderRadius: 8 }}
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
            className={`text-foreground ${isRtl ? "text-right" : ""}`}
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

      {/* Description — 3-line clamp */}
      {description ? (
        <Text
          className={`text-sm text-muted-foreground px-4 pb-2 ${isRtl ? "text-right" : ""}`}
          numberOfLines={3}
        >
          {description}
        </Text>
      ) : null}

      {/* Meta row — location + fees */}
      <View
        className={`flex-row flex-wrap gap-x-4 gap-y-1 px-4 pb-3 items-center ${isRtl ? "flex-row-reverse" : ""}`}
      >
        {location ? (
          <View className={`flex-row items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
            <MapPin size={13} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
        {fees && fees !== "-" ? (
          <View className={`flex-row items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
            <DollarSign size={13} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">{fees}</Text>
          </View>
        ) : null}
      </View>

      {/* Actions */}
      <View className={`flex-row gap-2 px-4 pb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
        <View className="flex-1">
          <Button
            label={isCompared ? t("inCompareList") : (compareLabel ?? t("addToCompare"))}
            variant="outline"
            action="primary"
            onPress={onAddToCompare}
            className={`h-11 ${isCompared ? "border-secondary" : ""}`}
          />
        </View>
        <View className="flex-1">
          <Button
            label={primaryLabel ?? t("checkInstitution")}
            action="primary"
            onPress={onPrimaryClick}
            className="h-11"
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
