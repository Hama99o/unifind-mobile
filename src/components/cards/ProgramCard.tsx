/**
 * ProgramCard — Gluestack composition for a program item.
 * Used in Favorites tab (Programs sub-tab) and future list screens.
 *
 * Shows: logo, program title, university, description, location,
 *        duration, degree, fees, language.
 * Actions: toggle favorite, add to compare, primary CTA.
 */

import { View, Image } from "react-native";
import { Heart, MapPin, Clock, GraduationCap, DollarSign, Globe, BookOpen } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Pressable } from "react-native";
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
    <View className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* Header row: logo + title + heart */}
      <View className="flex-row items-start gap-3 p-4 pb-3">
        {logoSrc ? (
          <Image
            source={{ uri: logoSrc }}
            style={{ width: 52, height: 52, borderRadius: 10 }}
            resizeMode="contain"
          />
        ) : (
          <View
            style={{ width: 52, height: 52, borderRadius: 10 }}
            className="bg-muted items-center justify-center"
          >
            <BookOpen size={24} color={colors.mutedForeground} />
          </View>
        )}
        <View className="flex-1">
          <Heading size="sm" className="text-foreground" numberOfLines={2}>
            {programTitle}
          </Heading>
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {universityName}
          </Text>
        </View>
        {onToggleFavorite && (
          <Pressable onPress={onToggleFavorite} hitSlop={8}>
            <Heart
              size={20}
              color={isFavorite ? colors.destructive : colors.mutedForeground}
              fill={isFavorite ? colors.destructive : "transparent"}
            />
          </Pressable>
        )}
      </View>

      {/* Description */}
      {description ? (
        <Text className="text-sm text-muted-foreground px-4 pb-3" numberOfLines={2}>
          {description}
        </Text>
      ) : null}

      {/* Meta chips */}
      <View className="flex-row flex-wrap gap-2 px-4 pb-3">
        <MetaChip icon={<MapPin size={12} color={colors.primary} />} label={location} />
        <MetaChip icon={<Clock size={12} color={colors.primary} />} label={duration} />
        <MetaChip icon={<GraduationCap size={12} color={colors.primary} />} label={degree} />
        {fees && <MetaChip icon={<DollarSign size={12} color={colors.primary} />} label={fees} />}
        {language && <MetaChip icon={<Globe size={12} color={colors.primary} />} label={language} />}
      </View>

      {/* Actions */}
      <View className="flex-row gap-2 px-4 pb-4">
        <View className="flex-1">
          <Button
            label={compareLabel}
            variant={isCompared ? "solid" : "outline"}
            action={isCompared ? "secondary" : "primary"}
            onPress={onAddToCompare}
            className="h-11"
          />
        </View>
        <View className="flex-1">
          <Button
            label={primaryLabel}
            action="primary"
            onPress={onPrimaryClick}
            className="h-11"
          />
        </View>
      </View>
    </View>
  );
}

function MetaChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-1 bg-lightgreen rounded-full px-2 py-1">
      {icon}
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}
