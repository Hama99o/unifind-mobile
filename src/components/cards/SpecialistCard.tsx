/**
 * SpecialistCard — card for a single specialist in the offering booking flow.
 *
 * Shows: avatar (with initial fallback), name, headline, bio (3 lines),
 *        favorite heart (top-right, auth-gated), "Book Now" / "Selected" button.
 *
 * RTL-safe. No hardcoded hex. Gluestack only.
 */

import { View, Image, Pressable } from "react-native";
import { User, Heart } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import type { NodeOfferingSpecialist } from "@/api/nodeOfferingApi";

export interface SpecialistCardProps {
  specialist: NodeOfferingSpecialist;
  isSelected: boolean;
  onSelect: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function SpecialistCard({
  specialist,
  isSelected,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
}: SpecialistCardProps) {
  const colors = useColors();
  const { t, isRtl } = useCustomTranslation();

  return (
    <Pressable
      onPress={onSelect}
      className={`bg-card rounded-2xl border p-4 ${
        isSelected ? "border-primary" : "border-border"
      }`}
      style={isSelected ? { shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 } : {}}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      {/* Top row: avatar + name/headline + favorite heart */}
      <View className={`flex-row items-start gap-3 mb-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        {/* Avatar */}
        <View
          style={{ width: 52, height: 52, borderRadius: 26, overflow: "hidden", borderWidth: 2, borderColor: isSelected ? colors.primary : colors.border }}
          className="bg-muted items-center justify-center shrink-0"
        >
          {specialist.avatar ? (
            <Image source={{ uri: specialist.avatar }} style={{ width: 52, height: 52 }} />
          ) : (
            <User size={22} color={colors.mutedForeground} />
          )}
        </View>

        {/* Name + headline */}
        <View className="flex-1">
          <Heading size="sm" className={`text-foreground ${isRtl ? "text-right" : ""}`} numberOfLines={1}>
            {specialist.name}
          </Heading>
          {specialist.headline ? (
            <Text className={`text-xs text-muted-foreground mt-0.5 ${isRtl ? "text-right" : ""}`} numberOfLines={1}>
              {specialist.headline}
            </Text>
          ) : null}
        </View>

        {/* Favorite heart (top-right) */}
        {onToggleFavorite ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFavorite();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? t("removeFavorite") : t("addToFavorite")}
            className="p-1 shrink-0"
          >
            <Heart
              size={20}
              color={isFavorite ? colors.destructive : colors.mutedForeground}
              fill={isFavorite ? colors.destructive : "transparent"}
            />
          </Pressable>
        ) : null}
      </View>

      {/* Bio */}
      {specialist.bio ? (
        <Text
          className={`text-sm text-muted-foreground mb-3 ${isRtl ? "text-right" : ""}`}
          numberOfLines={3}
        >
          {specialist.bio}
        </Text>
      ) : null}

      {/* Book Now / Selected button */}
      <Button
        label={isSelected ? t("selected") : t("bookNow")}
        action="primary"
        variant={isSelected ? "solid" : "outline"}
        onPress={onSelect}
        className="w-full"
      />
    </Pressable>
  );
}
