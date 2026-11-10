/**
 * AboutUsScreen — "Our Story".
 * Web parity: /[locale]/about-us (unifind/frontend/src/app/[locale]/about-us/OurStoryPage.tsx)
 *
 * Sections (same order as web): heading · story paragraph + illustration ·
 * second paragraph · UniFind by the numbers · quote · why-us intro · 4 why-us cards.
 * Static content: all copy comes from translations (aboutUs* keys, en + ar).
 */

import { Image, ScrollView, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Laptop, Lightbulb, Target, Users, type LucideIcon } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { AppHeader } from "@/components/shared/AppHeader";
import { IconCircle } from "@/components/shared/IconCircle";
import { NumbersSection } from "@/screens/home/NumbersSection";
import { useColors } from "@/hooks/useColors";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

const storyImage = require("../../../assets/images/our-story.png");

const WHY_US: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Laptop, title: "aboutUsWhyUsCardTitle", description: "aboutUsWhyUsCardDescription" },
  { icon: Users, title: "aboutUsWhyUsCardTitle2", description: "aboutUsWhyUsCardDescription2" },
  { icon: Target, title: "aboutUsWhyUsCardTitle3", description: "aboutUsWhyUsCardDescription3" },
  { icon: Lightbulb, title: "aboutUsWhyUsCardTitle4", description: "aboutUsWhyUsCardDescription4" },
];

export default function AboutUsScreen() {
  const { t, isRtl } = useCustomTranslation();
  const colors = useColors();
  const align = isRtl ? "text-right" : "text-left";
  const { width: windowWidth } = useWindowDimensions();
  const imageWidth = windowWidth - 32; // px-4 gutters

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <AppHeader title={t("navAboutUs")} showBack />
      <ScrollView testID="about-us-screen" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Heading + story */}
        <View className="px-4 pt-6 gap-4">
          <Heading size="2xl" className={`text-foreground ${align}`}>
            {t("aboutUsHeading1")} <Heading size="2xl" className="text-secondary">{t("aboutUsHeading2")}</Heading>
          </Heading>
          <Text className={`text-base leading-6 text-foreground ${align}`}>{t("aboutUsParagraph1")}</Text>
          <Image
            source={storyImage}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            style={{ width: imageWidth, height: (imageWidth * 652) / 1070 }}
          />
          <Text className={`text-base leading-6 text-foreground ${align}`}>{t("aboutUsParagraph2")}</Text>
        </View>

        {/* Numbers */}
        <View className="mt-8">
          <NumbersSection titleKey="aboutUsNumbersTitle" />
        </View>

        {/* Quote + why us */}
        <View className="px-4 pt-8 gap-4">
          <Heading size="xl" className={`text-foreground ${align}`}>{t("aboutUsWhyUsHeading1")}</Heading>
          <View
            className="rounded-xl bg-muted p-4 gap-2"
            style={isRtl ? { borderRightWidth: 4, borderRightColor: colors.secondary } : { borderLeftWidth: 4, borderLeftColor: colors.secondary }}
          >
            <Text className={`text-lg italic text-foreground ${align}`}>{t("aboutUsWhyUsHeading2")}</Text>
            <Text className={`text-sm font-semibold text-muted-foreground ${align}`}>— {t("aboutUsWhyUsQuoteAuthor")}</Text>
          </View>
          <Text className={`text-base leading-6 text-foreground ${align}`}>{t("aboutUsWhyUsParagraph")}</Text>
          <Heading size="lg" className={`text-foreground ${align}`}>{t("aboutUsWhyUsTitle")}</Heading>
          <Text className={`text-base leading-6 text-muted-foreground ${align}`}>{t("aboutUsWhyUsDescription")}</Text>

          <View className="gap-3">
            {WHY_US.map(({ icon: Icon, title, description }) => (
              <View
                key={title}
                className={`rounded-2xl border border-border bg-card p-4 gap-3 flex-row ${isRtl ? "flex-row-reverse" : ""}`}
              >
                <IconCircle size={44}>
                  <Icon color={colors.primary} size={22} />
                </IconCircle>
                <View className="flex-1 gap-1">
                  <Text className={`text-base font-semibold text-foreground ${align}`}>{t(title)}</Text>
                  <Text className={`text-sm leading-5 text-muted-foreground ${align}`}>{t(description)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
