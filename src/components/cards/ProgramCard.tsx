/**
 * ProgramCard — Gluestack composition for a program list item.
 * Used in FindProgramsScreen and Favorites (Programs sub-tab).
 *
 * Visual hierarchy (top → bottom):
 *   1. Logo + Program name (Heading/sm) + university (muted) + heart
 *   2. Description (2-line, muted) — optional
 *   3. Meta badges: location · duration · degree · fees · language
 *      — bg-lightgreen chips with primary-colored icons for contrast
 *   4. Action row: Add to Compare (outline) · Check Program (primary)
 *
 * Design fixes:
 *   - Icon color on lightgreen chip = primary (prussian) for readable contrast
 *   - Text inside chip = foreground (not muted-foreground which is too light on lightgreen)
 *   - Card padding: p-4 consistently; actions have border-t separator for breathing
 *   - 44px min-height buttons for touch ergonomics
 *   - Hardcoded string defaults replaced by caller passing translated labels
 */

import React from "react";
import { View, Image, Pressable } from "react-native";
import { Heart, MapPin, Clock, GraduationCap, DollarSign, Globe, BookOpen } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { useColors } from "@/hooks/useColors";

export interface ProgramCardProps {
  documentId: string;
  logoSrc?: string;
  programTitle: string;
  universityName: string;
  description?: string;
  location: string;
  duration: string;
  degree: string;
  fees?: string;
  language?: string;
  isFavorite?: boolean;
  isCompared?: boolean;
  onToggleFavorite?: () => void;
  onAddToCompare?: () => void;
  onPrimaryClick?: () => void;
  compareLabel?: string;
  primaryLabel?: string;
}

export function ProgramCard({
  logoSrc,
  programTitle,
  universityName,
  description,
  location,
  duration,
  degree,
  fees,
  language,
  isFavorite,
  isCompared,
  onToggleFavorite,
  onAddToCompare,
  onPrimaryClick,
  compareLabel = "Add to Compare",
  primaryLabel = "Check Program",
}: ProgramCardProps) {
  const colors = useColors();

  return (
    <View className="bg-card rounded-2xl border border-border overflow-hidden" style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
      {/* Header row: logo + title/university + heart */}
      <View className="flex-row items-start gap-3 p-4 pb-3">
        {logoSrc ? (
          <Image
            source={{ uri: logoSrc }}
            style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: colors.muted }}
            resizeMode="contain"
          />
        ) : (
          <View
            style={{ width: 48, height: 48, borderRadius: 10 }}
            className="bg-lightgreen items-center justify-center"
          >
            <BookOpen size={22} color={colors.primary} />
          </View>
        )}
        <View className="flex-1 gap-0.5">
          <Heading size="sm" className="text-foreground leading-snug" numberOfLines={2}>
            {programTitle}
          </Heading>
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {universityName}
          </Text>
        </View>
        {onToggleFavorite && (
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={10}
            testID="card-program-favorite"
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
            style={{ marginTop: 2 }}
          >
            <Heart
              size={20}
              color={isFavorite ? colors.destructive : colors.mutedForeground}
              fill={isFavorite ? colors.destructive : "transparent"}
            />
          </Pressable>
        )}
      </View>

      {/* Description — 2-line clamp */}
      {description ? (
        <Text className="text-sm text-muted-foreground px-4 pb-3 leading-relaxed" numberOfLines={2}>
          {description}
        </Text>
      ) : null}

      {/* Meta chips — primary-colored icons on lightgreen for proper contrast */}
      <View className="flex-row flex-wrap gap-2 px-4 pb-4">
        <MetaChip icon={<MapPin size={11} color={colors.primary} />} label={location} />
        <MetaChip icon={<Clock size={11} color={colors.primary} />} label={duration} />
        <MetaChip icon={<GraduationCap size={11} color={colors.primary} />} label={degree} />
        {fees && <MetaChip icon={<DollarSign size={11} color={colors.primary} />} label={fees} />}
        {language && <MetaChip icon={<Globe size={11} color={colors.primary} />} label={language} />}
      </View>

      {/* Actions — border-t separator + comfortable padding */}
      <View className="flex-row gap-2 px-4 pb-4 border-t border-border pt-3">
        <View className="flex-1">
          <Button
            label={compareLabel}
            variant={isCompared ? "solid" : "outline"}
            action={isCompared ? "secondary" : "primary"}
            onPress={onAddToCompare}
            style={{ height: 44 }}
            testID="card-program-compare"
          />
        </View>
        <View className="flex-1">
          <Button
            label={primaryLabel}
            action="primary"
            onPress={onPrimaryClick}
            style={{ height: 44 }}
            testID="card-program-primary"
          />
        </View>
      </View>
    </View>
  );
}

// MetaChip — foreground text on lightgreen background for readable contrast.
// text-foreground (prussian) not text-muted-foreground (grey) — lightgreen
// background is too light for grey text to pass the squint test.
function MetaChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-1 bg-lightgreen border border-secondary rounded-full px-2.5 py-1">
      {icon}
      <Text className="text-xs font-medium text-foreground" numberOfLines={1}>{label}</Text>
    </View>
  );
}
