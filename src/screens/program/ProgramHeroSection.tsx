/**
 * ProgramHeroSection — Section 1 of ProgramDetailScreen.
 *
 * Reuses HeroDetailCard.
 * - Logo = institution.logo.url
 * - Title = program.name
 * - Subtitle = institution.name (clickable → institution detail)
 * - Rating stars + "(N reviews)" from institution-level aggregate
 * - Favorite heart (Program, auth-gated, optimistic)
 * - Share
 * - Know More → Linking.openURL(knowMoreURL), auth-gated with Lock icon
 * - University Page → institution detail route
 * - Add to Compare / In Compare List toggle
 * - Breadcrumb strip: Home › Program Explorer › Institution → Programs › program.name
 *
 * RTL-safe. No hardcoded hex.
 */

import { View, Pressable, Linking } from "react-native";
import { Lock, Home, ChevronRight, ChevronLeft } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { HeroDetailCard } from "@/components/shared/HeroDetailCard";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { router } from "expo-router";
import type { ProgramListItem } from "@/api/programsApiTypes";

interface ProgramHeroSectionProps {
  program: ProgramListItem;
  rating: number;
  nbReviews: number;
  isFavorite: boolean;
  isCompared: boolean;
  isLoggedIn: boolean;
  onToggleFavorite: () => void;
  onAddToCompare: () => void;
}

export function ProgramHeroSection({
  program,
  rating,
  nbReviews,
  isFavorite,
  isCompared,
  isLoggedIn,
  onToggleFavorite,
  onAddToCompare,
}: ProgramHeroSectionProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  const institution = program.institution;

  const handleKnowMore = () => {
    if (!program.knowMoreURL) return;
    const url = program.knowMoreURL.startsWith("http")
      ? program.knowMoreURL
      : `https://${program.knowMoreURL}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleUniversityPage = () => {
    if (!institution?.slug) return;
    router.push(`/(main)/institutions/${institution.slug}` as never);
  };

  return (
    <View>
      {/* Breadcrumb */}
      <View
        className={`flex-row flex-wrap items-center gap-1 px-4 pt-3 pb-2 ${isRtl ? "flex-row-reverse" : ""}`}
      >
        <Pressable onPress={() => router.push("/(main)/(tabs)/home" as never)}>
          <Home size={12} color={colors.mutedForeground} />
        </Pressable>
        <Chevron size={12} color={colors.mutedForeground} />
        <Pressable onPress={() => router.push("/(main)/(tabs)/program-explorer" as never)}>
          <Text className="text-xs text-muted-foreground">
            {t("programExplorer.title")}
          </Text>
        </Pressable>
        {institution?.slug ? (
          <>
            <Chevron size={12} color={colors.mutedForeground} />
            <Pressable onPress={handleUniversityPage}>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {institution.name ?? "-"}
              </Text>
            </Pressable>
          </>
        ) : null}
        <Chevron size={12} color={colors.mutedForeground} />
        <Text
          className="text-xs text-foreground font-medium"
          numberOfLines={1}
        >
          {program.name}
        </Text>
      </View>

      {/* Hero card */}
      <View className="px-4">
        <HeroDetailCard
          logoSrc={institution?.logo?.url}
          title={program.name}
          subtitle={institution?.name}
          rating={rating}
          nbReviews={nbReviews}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          shareTitle={`${program.name} — UniFind`}
          primaryButton={{
            label: t("knowMore"),
            variant: "solid",
            onPress: isLoggedIn ? handleKnowMore : () => {},
            leftIcon: isLoggedIn ? undefined : (
              <Lock size={14} color={colors.primaryForeground} />
            ),
          }}
          secondaryButton={{
            label: t("university_page"),
            variant: "outline",
            onPress: handleUniversityPage,
          }}
          tertiaryButton={{
            label: isCompared ? t("inCompareList") : t("btnAddToCompare"),
            variant: isCompared ? "solid" : "outline",
            action: isCompared ? "secondary" : "primary",
            onPress: onAddToCompare,
          }}
        />
      </View>
    </View>
  );
}
