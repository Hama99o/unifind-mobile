/**
 * TestimonialsSection — "What Students Say" snap carousel.
 *
 * Design:
 *  - SectionHeader with consistent section rhythm.
 *  - Rich TestimonialCards: image header, prominent rating, quote, avatar row.
 *  - Section fade-in after load.
 *
 * Section 6 of the home screen.
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

import { TestimonialCard } from "@/components/cards/TestimonialCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { fetchTestimonials, type TestimonialItem } from "@/services/testimonialsService";
import { SectionSkeleton } from "@/screens/home/SectionSkeleton";
import { showToast } from "@/stores/toastStore";

const CARD_WIDTH = 288;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

export function TestimonialsSection() {
  const { t, lang } = useCustomTranslation();
  const locale = lang === "ar" ? "ar" : "en";

  const { data: testimonials = [], isLoading, isError } = useQuery({
    queryKey: ["testimonials", locale],
    queryFn: () => fetchTestimonials(locale),
    staleTime: 5 * 60 * 1000,
  });

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (!isLoading && testimonials.length) {
      opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
    }
  }, [isLoading, testimonials.length]);

  if (isLoading) return <SectionSkeleton />;
  if (isError || !testimonials.length) return null;

  return (
    <Animated.View style={animStyle}>
      <View className="pt-7 pb-6 bg-background">
        <SectionHeader titleKey="studentSay" className="px-4" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          snapToAlignment="start"
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 32 }}
        >
          {testimonials.map((item: TestimonialItem, index: number) => (
            <TestimonialCard
              key={index}
              imageUrl={item.imageUrl}
              logoUrl={item.logoUrl || undefined}
              title={item.title}
              rating={item.rating}
              testimonial={item.testimonial}
              userName={item.userName}
              userAvatar={item.userAvatar}
              userProgram={item.userProgram}
              onPress={() => {
                // Detail screen not built yet — give clear feedback so the tap responds.
                // TODO: navigate when detail screens are built
                showToast(`${item.title} · ${t("common.comingSoon")}`);
              }}
            />
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
}
