/**
 * TermsScreen — static Terms & Conditions rendered from translations.
 *
 * All content comes from the `terms.*` i18n keys (sections 1–5 + conclusion).
 * No API calls; purely presentational.
 * RTL-safe; light-mode tokens only.
 */

import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { AppHeader } from "@/components/shared/AppHeader";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

// ─── Re-usable renderers ─────────────────────────────────────────────────────

function SectionTitle({ text }: { text: string }) {
  return (
    <View className="border-l-4 border-secondary pl-3 mt-6 mb-2">
      <Heading size="md" className="text-primary font-bold">
        {text}
      </Heading>
    </View>
  );
}

function SubTitle({ text }: { text: string }) {
  return (
    <Heading size="sm" className="text-primary font-semibold mt-4 mb-1">
      {text}
    </Heading>
  );
}

function Para({ text }: { text: string }) {
  if (!text) return null;
  return (
    <Text className="text-foreground text-sm leading-relaxed mb-1">{text}</Text>
  );
}

function Bullet({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View className="flex-row gap-2 mb-1 ps-2">
      <Text className="text-muted-foreground text-sm mt-0.5">•</Text>
      <Text className="text-foreground text-sm leading-relaxed flex-1">{text}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TermsScreen() {
  const { t } = useCustomTranslation();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <AppHeader title={t("terms.heading")} showBack />
      <ScrollView
        className="px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Section 1: General Terms ──────────────────────────────────── */}
        <SectionTitle text={t("terms.section1.title")} />
        <Para text={t("terms.section1.intro")} />

        <SubTitle text={t("terms.section1.sub1.title")} />
        <Para text={t("terms.section1.sub1.text")} />
        <Bullet text={t("terms.section1.sub1.bullet1")} />
        <Bullet text={t("terms.section1.sub1.bullet2")} />
        <Bullet text={t("terms.section1.sub1.bullet3")} />

        <SubTitle text={t("terms.section1.sub2.title")} />
        <Bullet text={t("terms.section1.sub2.bullet1")} />
        <Bullet text={t("terms.section1.sub2.bullet2")} />
        <Bullet text={t("terms.section1.sub2.bullet3")} />

        <SubTitle text={t("terms.section1.sub3.title")} />
        <Para text={t("terms.section1.sub3.text")} />

        <Divider className="mt-6" />

        {/* ── Section 2: Privacy Policy ──────────────────────────────────── */}
        <SectionTitle text={t("terms.section2.title")} />

        <SubTitle text={t("terms.section2.sub1.title")} />
        <Para text={t("terms.section2.sub1.text")} />
        <Bullet text={t("terms.section2.sub1.item1")} />
        <Bullet text={t("terms.section2.sub1.item2")} />
        <Bullet text={t("terms.section2.sub1.item3")} />
        <Bullet text={t("terms.section2.sub1.item4")} />
        <Bullet text={t("terms.section2.sub1.item5")} />
        <Bullet text={t("terms.section2.sub1.item6")} />

        <SubTitle text={t("terms.section2.sub2.title")} />
        <Para text={t("terms.section2.sub2.text")} />
        <Bullet text={t("terms.section2.sub2.item1")} />
        <Bullet text={t("terms.section2.sub2.item2")} />
        <Bullet text={t("terms.section2.sub2.item3")} />
        <Bullet text={t("terms.section2.sub2.item4")} />
        <Bullet text={t("terms.section2.sub2.item5")} />

        <SubTitle text={t("terms.section2.sub3.title")} />
        <Para text={t("terms.section2.sub3.text")} />

        <SubTitle text={t("terms.section2.sub4.title")} />
        <Para text={t("terms.section2.sub4.text")} />

        <SubTitle text={t("terms.section2.sub5.title")} />
        <Para text={t("terms.section2.sub5.text")} />

        <Divider className="mt-6" />

        {/* ── Section 3: Service Delivery ──────────────────────────────── */}
        <SectionTitle text={t("terms.section3.title")} />

        <SubTitle text={t("terms.section3.sub1.title")} />
        <Para text={t("terms.section3.sub1.text")} />

        <SubTitle text={t("terms.section3.sub2.title")} />
        <Bullet text={t("terms.section3.sub2.bullet1")} />
        <Bullet text={t("terms.section3.sub2.bullet2")} />
        <Bullet text={t("terms.section3.sub2.bullet3")} />

        <SubTitle text={t("terms.section3.sub3.title")} />
        <Para text={t("terms.section3.sub3.text")} />

        <SubTitle text={t("terms.section3.sub4.title")} />
        <Para text={t("terms.section3.sub4.text")} />

        <Divider className="mt-6" />

        {/* ── Section 4: Cancellation & Refund ────────────────────────── */}
        <SectionTitle text={t("terms.section4.title")} />

        <SubTitle text={t("terms.section4.sub1.subsub1.title")} />
        <Para text={t("terms.section4.sub1.subsub1.text")} />
        <Bullet text={t("terms.section4.sub1.subsub1.bullet1")} />
        <Bullet text={t("terms.section4.sub1.subsub1.bullet2")} />
        <Bullet text={t("terms.section4.sub1.subsub1.bullet3")} />

        <SubTitle text={t("terms.section4.sub1.subsub2.title")} />
        <Para text={t("terms.section4.sub1.subsub2.text")} />
        <Bullet text={t("terms.section4.sub1.subsub2.bullet1")} />
        <Bullet text={t("terms.section4.sub1.subsub2.bullet2")} />
        <Bullet text={t("terms.section4.sub1.subsub2.bullet3")} />

        <SubTitle text={t("terms.section4.sub1.subsub3.title")} />
        <Para text={t("terms.section4.sub1.subsub3.text")} />

        <SubTitle text={t("terms.section4.sub1.subsub4.title")} />
        <Para text={t("terms.section4.sub1.subsub4.text")} />

        <SubTitle text={t("terms.section4.sub1.subsub5.title")} />
        <Para text={t("terms.section4.sub1.subsub5.text")} />

        <SubTitle text={t("terms.section4.sub2.title")} />
        <Para text={t("terms.section4.sub2.text")} />

        <SubTitle text={t("terms.section4.sub3.title")} />
        <Para text={t("terms.section4.sub3.text")} />

        <SubTitle text={t("terms.section4.sub4.title")} />
        <Para text={t("terms.section4.sub4.text")} />

        <SubTitle text={t("terms.section4.sub5.title")} />
        <Para text={t("terms.section4.sub5.text")} />

        <Divider className="mt-6" />

        {/* ── Section 5: Advertisements ───────────────────────────────── */}
        <SectionTitle text={t("terms.section5.title")} />

        <SubTitle text={t("terms.section5.sub1.title")} />
        <Para text={t("terms.section5.sub1.text")} />

        <SubTitle text={t("terms.section5.sub2.title")} />
        <Bullet text={t("terms.section5.sub2.bullet1")} />
        <Bullet text={t("terms.section5.sub2.bullet2")} />

        <SubTitle text={t("terms.section5.sub3.title")} />
        <Para text={t("terms.section5.sub3.text")} />

        <SubTitle text={t("terms.section5.sub4.title")} />
        <Para text={t("terms.section5.sub4.text")} />

        <SubTitle text={t("terms.section5.sub5.title")} />
        <Para text={t("terms.section5.sub5.text")} />

        <Divider className="mt-6" />

        {/* ── Conclusion ───────────────────────────────────────────────── */}
        <SectionTitle text={t("terms.conclusionTitle")} />
        <Para text={t("terms.conclusion.text")} />
      </ScrollView>
    </SafeAreaView>
  );
}
