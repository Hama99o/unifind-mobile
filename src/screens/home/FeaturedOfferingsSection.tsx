/**
 * FeaturedOfferingsSection — premium snap carousel of featured offerings.
 *
 * Design:
 *  - Rounded prussian container with a subtle turquoise top border accent.
 *  - SectionHeader (on-dark) with "See all" affordance.
 *  - Cinematic FeaturedCards with left content inset and next-card peek.
 *  - Section fade-in on load.
 *
 * Section 3 of the home screen.
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
import { extractPlainText, fetchFeaturedOfferings, type FeaturedOffering } from "@/api/catalog";
import { SectionSkeleton } from "@/screens/home/SectionSkeleton";

const CARD_WIDTH = 280;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

export function FeaturedOfferingsSection() {
  const { t, lang } = useCustomTranslation();
  const colors = useColors();
  const locale = lang === "ar" ? "ar" : "en";
  const router = useRouter();

  const { data: offerings = [], isLoading } = useQuery({
    queryKey: ["featuredOfferings", locale],
    queryFn: () => fetchFeaturedOfferings(locale),
    staleTime: 5 * 60 * 1000,
  });

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (!isLoading && offerings.length) {
      opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
    }
  }, [isLoading, offerings.length]);

  if (isLoading) return <SectionSkeleton dark />;
  if (!offerings.length) return null;

  return (
    <Animated.View style={animStyle}>
      {/* Rounded prussian band with top turquoise accent line */}
      <View className="mx-0 my-0 bg-prussian" style={{ borderTopWidth: 2, borderTopColor: colors.secondary }}>
        <View className="pt-7 pb-6">
          <SectionHeader
            titleKey="discoverOurOfferings"
            onSeeAll={() => router.push("/(main)/(tabs)/growth-center")}
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
            {offerings.map((offering: FeaturedOffering) => (
              <FeaturedCard
                key={offering.id}
                imageUrl={offering.imageUrl}
                categoryLabel={offering.category?.name}
                categoryIcon={offering.category?.icon}
                title={offering.title}
                description={extractPlainText(offering.description)}
                badge={t("offering")}
                onPress={() => {
                  // TODO: router.push(`/(main)/growth-center/offerings/${offering.slug}`)
                }}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Animated.View>
  );
}
