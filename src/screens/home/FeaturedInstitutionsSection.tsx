/**
 * FeaturedInstitutionsSection — premium snap carousel of featured institutions.
 *
 * Design:
 *  - Shares the same prussian band visual as FeaturedOfferingsSection.
 *  - SectionHeader (on-dark) with "See all" affordance.
 *  - Cinematic FeaturedCards with logo floating on image.
 *  - Section fade-in on load.
 *
 * Section 5 of the home screen.
 */

import { useEffect } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { FeaturedCard } from "@/components/cards/FeaturedCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { extractPlainText, fetchFeaturedInstitutions, type FeaturedInstitution } from "@/api/catalog";
import { SectionSkeleton } from "@/screens/home/SectionSkeleton";

const CARD_WIDTH = 280;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

export function FeaturedInstitutionsSection() {
  const { t, lang } = useCustomTranslation();
  const colors = useColors();
  const locale = lang === "ar" ? "ar" : "en";
  const router = useRouter();

  const { data: institutions = [], isLoading } = useQuery({
    queryKey: ["featuredInstitutions", locale],
    queryFn: () => fetchFeaturedInstitutions(locale),
    staleTime: 5 * 60 * 1000,
  });

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (!isLoading && institutions.length) {
      opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
    }
  }, [isLoading, institutions.length]);

  if (isLoading) return <SectionSkeleton dark />;
  if (!institutions.length) return null;

  return (
    <Animated.View style={animStyle}>
      <View className="bg-prussian" style={{ borderTopWidth: 2, borderTopColor: colors.secondary }}>
        <View className="pt-7 pb-6">
          <SectionHeader
            titleKey="featuredInstitutions"
            onSeeAll={() => router.push("/(main)/(tabs)/program-explorer")}
            onDark
            className="px-4"
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP_INTERVAL}
            decelerationRate="fast"
            snapToAlignment="start"
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 32 }}
          >
            {institutions.map((inst: FeaturedInstitution) => (
              <FeaturedCard
                key={inst.id}
                imageUrl={inst.photoCoverUrl}
                logoUrl={inst.logoUrl}
                title={inst.name}
                description={extractPlainText(inst.about)}
                subLine={
                  [inst.mainLocation.street, inst.mainLocation.cityName]
                    .filter(Boolean)
                    .join(", ")
                }
                badge={t("institution")}
                onPress={() => {
                  // TODO: router.push(`/(main)/program-explorer/institutions/${inst.slug}`)
                }}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Animated.View>
  );
}
