/**
 * InstitutionHeroSection — Section 1 of InstitutionDetailScreen.
 *
 * Cover image (30% opacity bg) + HeroDetailCard + key-stats row.
 * Hero card: logo, name, acronym, rating, reviews, favorite toggle,
 *   share, Know More (auth-gated), Add a Review (scroll), Add/In Compare.
 * Stats row: Main Campus, Website (openURL), Email (mailto), N+ Programs.
 *
 * RTL-safe. No hardcoded hex.
 */

import { View, Image, Pressable, Linking } from "react-native";
import { MapPin, Globe, Mail, Hash, Lock } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { HeroDetailCard } from "@/components/shared/HeroDetailCard";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import type { InstitutionDetailItem } from "@/api/institutionDetailApi";

interface InstitutionHeroSectionProps {
  institution: InstitutionDetailItem;
  rating: number;
  nbReviews: number;
  nbPrograms: number;
  isFavorite: boolean;
  isCompared: boolean;
  isLoggedIn: boolean;
  onToggleFavorite: () => void;
  onAddToCompare: () => void;
  onAddReviewPress: () => void;
}

export function InstitutionHeroSection({
  institution,
  rating,
  nbReviews,
  nbPrograms,
  isFavorite,
  isCompared,
  isLoggedIn,
  onToggleFavorite,
  onAddToCompare,
  onAddReviewPress,
}: InstitutionHeroSectionProps) {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();

  const handleKnowMore = () => {
    if (!institution.website) return;
    const url = institution.website.startsWith("http")
      ? institution.website
      : `https://${institution.website}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleWebsite = () => {
    if (!institution.website) return;
    const url = institution.website.startsWith("http")
      ? institution.website
      : `https://${institution.website}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleEmail = () => {
    if (!institution.email) return;
    Linking.openURL(`mailto:${institution.email}`).catch(() => {});
  };

  const city = institution.mainLocation?.city?.name ?? "-";

  return (
    <View>
      {/* Cover image band */}
      <View className="h-40 w-full relative overflow-hidden">
        {institution.photoCover?.url ? (
          <Image
            source={{ uri: institution.photoCover.url }}
            style={{ width: "100%", height: "100%", opacity: 0.3 }}
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-primary opacity-30" />
        )}
      </View>

      {/* Hero card overlapping cover */}
      <View className="px-4 -mt-8">
        <HeroDetailCard
          logoSrc={institution.logo?.url}
          title={institution.name || "-"}
          subtitle={institution.acronym}
          rating={rating}
          nbReviews={nbReviews}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          shareTitle={`${institution.name} — UniFind`}
          primaryButton={{
            label: t("knowMore"),
            variant: "solid",
            onPress: isLoggedIn ? handleKnowMore : () => {},
            leftIcon: isLoggedIn ? undefined : (
              <Lock size={14} color={colors.primaryForeground} />
            ),
          }}
          secondaryButton={{
            label: t("add_review"),
            variant: "outline",
            onPress: onAddReviewPress,
          }}
          tertiaryButton={{
            label: isCompared ? t("inCompareList") : t("btnAddToCompare"),
            variant: isCompared ? "solid" : "outline",
            action: isCompared ? "secondary" : "primary",
            onPress: onAddToCompare,
          }}
        />
      </View>

      {/* Stats row */}
      <View
        className={`flex-row flex-wrap gap-x-4 gap-y-2 px-4 py-4 bg-card mx-4 mt-3 rounded-xl shadow-sm border border-border ${
          isRtl ? "flex-row-reverse" : ""
        }`}
      >
        {/* Main Campus */}
        <View className={`flex-row items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
          <MapPin size={14} color={colors.primary} />
          <View>
            <Text className="text-xs text-muted-foreground">{t("main_campus")}</Text>
            <Text className="text-xs font-semibold text-foreground">{city}</Text>
          </View>
        </View>

        {/* Website */}
        {institution.website ? (
          <Pressable
            onPress={handleWebsite}
            className={`flex-row items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}
          >
            <Globe size={14} color={colors.primary} />
            <View>
              <Text className="text-xs text-muted-foreground">{t("website")}</Text>
              <Text className="text-xs font-semibold text-primary" numberOfLines={1}>
                {institution.website.replace(/^https?:\/\/(www\.)?/, "")}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {/* Email */}
        {institution.email ? (
          <Pressable
            onPress={handleEmail}
            className={`flex-row items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}
          >
            <Mail size={14} color={colors.primary} />
            <View>
              <Text className="text-xs text-muted-foreground">{t("email_address")}</Text>
              <Text className="text-xs font-semibold text-primary" numberOfLines={1}>
                {institution.email}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {/* Programs count */}
        <View className={`flex-row items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
          <Hash size={14} color={colors.primary} />
          <View>
            <Text className="text-xs text-muted-foreground">{t("nb_programs")}</Text>
            <Text className="text-xs font-semibold text-foreground">
              {nbPrograms}+ {t("programs")}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
